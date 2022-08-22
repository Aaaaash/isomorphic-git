// @ts-check
import '../typedefs.js'

import { TREE } from '../commands/TREE.js'
import { _readObject } from '../storage/readObject.js'

import { join } from './join.js'
import { mergeBlobs } from './mergeTree.js'
import { GitWalkSymbol } from './symbols.js'
import { _walk } from '../commands/walk.js'

export async function mergeTreeWitchConflict({
  fs,
  cache,
  dir,
  gitdir = join(dir, '.git'),
  ourOid,
  baseOid,
  theirOid,
  ourName = 'ours',
  baseName = 'base',
  theirName = 'theirs',
  files = [],
  mergeDriver,
}) {
  const ourTree = TREE({ ref: ourOid })
  const baseTree = TREE({ ref: baseOid })
  const theirTree = TREE({ ref: theirOid })

  await _walk({
    fs,
    cache,
    dir,
    gitdir,
    trees: [ourTree, baseTree, theirTree],
  })

  const ourWalker = ourTree[GitWalkSymbol]({ fs, dir, gitdir, cache })
  const baseWalker = baseTree[GitWalkSymbol]({ fs, dir, gitdir, cache })
  const theirWalker = theirTree[GitWalkSymbol]({ fs, dir, gitdir, cache })

  const entries = files.map(filepath => {
    const ours = new ourWalker.ConstructEntry(filepath)
    const base = new baseWalker.ConstructEntry(filepath)
    const theirs = new theirWalker.ConstructEntry(filepath)
    return { ours, base, theirs, path: filepath }
  })
  const mergeResults = []

  for (const entry of entries) {
    const { ours, base, theirs, path } = entry
    try {
      const result = await mergeBlobs({
        fs,
        gitdir,
        path,
        ours,
        base,
        theirs,
        ourName,
        baseName,
        theirName,
        mergeDriver,
      })
      if (!result.cleanMerge) {
        const obj = await _readObject({
          fs,
          cache,
          gitdir,
          oid: result.mergeResult.oid,
          format: 'content',
        })
        mergeResults.push({
          ...result,
          content: new TextDecoder().decode(obj.object),
        })
      }
    } catch (err) {}
  }
  return mergeResults
}

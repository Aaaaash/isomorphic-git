// @ts-check
import '../typedefs.js'

import { _currentBranch } from '../commands/currentBranch.js'
import { _findMergeBase } from '../commands/findMergeBase.js'
import { MergeNotSupportedError } from '../errors/MergeNotSupportedError.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { mergeTreeWitchConflict } from '../utils/mergeTreeWithConflict.js'

export async function _mergeWithConflict({
  fs,
  cache,
  dir,
  gitdir,
  ours,
  theirs,
  files,
  mergeDriver,
}) {
  if (ours === undefined) {
    ours = await _currentBranch({ fs, gitdir, fullname: true })
  }
  ours = await GitRefManager.expand({
    fs,
    gitdir,
    ref: ours,
  })
  theirs = await GitRefManager.expand({
    fs,
    gitdir,
    ref: theirs,
  })

  const ourOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: ours,
  })

  const theirOid = await GitRefManager.resolve({
    fs,
    gitdir,
    ref: theirs,
  })
  // find most recent common ancestor of ref a and ref b
  const baseOids = await _findMergeBase({
    fs,
    cache,
    gitdir,
    oids: [ourOid, theirOid],
  })
  if (baseOids.length !== 1) {
    throw new MergeNotSupportedError()
  }

  const baseOid = baseOids[0]
  // handle fast-forward case
  if (baseOid === theirOid) {
    return {
      oid: ourOid,
      alreadyMerged: true,
    }
  }

  const result = await mergeTreeWitchConflict({
    fs,
    cache,
    dir,
    gitdir,
    ourOid,
    theirOid,
    baseOid,
    files,
    mergeDriver,
  })
  return result
}

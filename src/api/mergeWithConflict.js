// @ts-check
import '../typedefs.js'

import { _mergeWithConflict } from '../commands/mergeWithConflict.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'

/**
 * @param {object} args
 * @param {FsClient} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} [args.gitdir = join(dir, '.git')]
 * @param {string} args.ours
 * @param {string} args.theirs
 * @param {string[]} args.files
 * @param {MergeDriverCallback} [args.mergeDriver]
 */
export async function mergeWithConflict({
  fs: _fs,
  cache = {},
  dir,
  gitdir = join(dir, '.git'),
  ours,
  theirs,
  files,
  mergeDriver,
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('cache', cache)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('ours', ours)
    assertParameter('theirs', theirs)
    assertParameter('files', files)
    const fs = new FileSystem(_fs)

    return await _mergeWithConflict({
      fs,
      cache,
      dir,
      gitdir,
      ours,
      theirs,
      files,
      mergeDriver,
    })
  } catch (err) {
    err.caller = 'git.mergeWithConflict'
    throw err
  }
}

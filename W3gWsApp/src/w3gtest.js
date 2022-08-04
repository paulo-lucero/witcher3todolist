import { queryInfo } from './w3gdefs';
async function getPragmaSettings(displayAll = false) {
  const defPragmaSets = {
    // 'n/a' values means default is not applicable
    // re-visit pragmas commands, to evaluate whether to include in execution
    analysis_limit: 0,
    application_id: 0,
    auto_vacuum: 0,
    automatic_index: 1,
    busy_timeout: 5000,
    cache_size: -2000,
    cache_spill: 483,
    case_sensitive_like: null,
    cell_size_check: 0,
    checkpoint_fullfsync: 0,
    collation_list: undefined, // = 0 --> last stop
    compile_options: undefined, // = "COMPILER=msvc-1929"
    count_changes: 0,
    data_store_directory: null,
    data_version: undefined, // = 1
    database_list: undefined, // = 0
    default_cache_size: -2000,
    defer_foreign_keys: 0,
    empty_result_callbacks: 0,
    encoding: 'UTF-8',
    foreign_key_check: null,
    foreign_key_list: null,
    foreign_keys: 0,
    freelist_count: undefined, // = 116
    full_column_names: 0,
    fullfsync: 0,
    function_list: undefined, // = "group_concat"
    hard_heap_limit: 0,
    ignore_check_constraints: 0,
    incremental_vacuum: null,
    index_info: null,
    index_list: null,
    index_xinfo: null,
    integrity_check: 'ok',
    journal_mode: 'delete',
    journal_size_limit: -1,
    legacy_alter_table: 0,
    locking_mode: 'normal',
    max_page_count: 1073741823,
    mmap_size: 0,
    module_list: undefined, // = "json_tree"
    optimize: null,
    page_count: undefined, // = 34446
    page_size: 4096,
    pragma_list: undefined,
    query_only: 0,
    quick_check: 'ok',
    read_uncommitted: 0,
    recursive_triggers: 0,
    reverse_unordered_selects: 0,
    schema_version: undefined,
    secure_delete: 0,
    short_column_names: 1,
    shrink_memory: null,
    soft_heap_limit: 0,
    synchronous: 2,
    table_info: null,
    table_xinfo: null,
    temp_store: 0,
    temp_store_directory: null,
    threads: 0,
    trusted_schema: 1,
    user_version: 0,
    wal_autocheckpoint: 1000,
    wal_checkpoint: 0,
    writable_schema: 0

    // -cache_spill : 483 -> 2000 * 1024 vs 483 * 4096  -> seem-reasonable : ok
    // -case_sensitive_like : setting-only : ok
    // -hard_heap_limit : queriable : ok
    // -ignore_check_constraints : setting-only : ok
    // -incremental_vacuum : effect-if-auto_vacuum=incremental : ok
    // -optimize : might-insignificant : ok
    // -query_only : queriable : ok
    // -schema_version queriable : ok
    // -shrink_memory : might-insignificant : ok
    // -soft_heap_limit : queriable : ok
    // -wal_checkpoint : effect-if-journal_mode=WAL : ok
    // -writable_schema : might-insignificant : ok
  };
  const pragmaSettings = await queryInfo('/testingenv/pragma-settings');

  const resultCheck = {
    notFound: [],
    notSame: {},
    allSame: null
  };

  for (const pragmaSetting in pragmaSettings) {
    if (pragmaSetting in defPragmaSets) {
      const defValue = defPragmaSets[pragmaSetting];
      const curValue = pragmaSettings[pragmaSetting];
      if (curValue !== defValue) {
        resultCheck.notSame[pragmaSetting] = { defaultValue: defValue, setValue: curValue };
      }
    } else {
      resultCheck.notFound.push(pragmaSetting);
    }
  }

  if (resultCheck.notFound.length === 0) {
    resultCheck.notFound = null;
  }

  if (Object.keys(resultCheck.notSame).length === 0) {
    resultCheck.notSame = null;
  }

  resultCheck.allSame = !resultCheck.notFound && !resultCheck.notSame;

  console.log(resultCheck);

  if (displayAll) console.log(pragmaSettings);
}

async function testTem() {
  const testResult = await queryInfo('/testingenv/testbefreq', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        redo: true
      }
    )
  });
  if (testResult.result_test !== null) {
    console.log(testResult.result_test);
  }
}

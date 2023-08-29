const Fs = require('fs');
const Path = require('path');
const Knex = require('knex');
const Bluebird = require('bluebird');
const { processEntry } = require('./lib');

const inputFilepath = Path.resolve(__dirname, '../output-responsive.csv');

// Setup database
const knex = Knex({
  client: 'sqlite3',
  useNullAsDefault: false,
  connection: {
    filename: 'db.sqlite'
  },
  migrations: {
    directory: Path.resolve(__dirname, 'knex/migrations')
  }
})

// Read the input file
const fileContentText = Fs.readFileSync(inputFilepath, 'utf-8');
// Parse each entry from the input file
const fileEntries = fileContentText
  // Split each newline into an array item
  .split('\n')
  // Filter out blank lines
  .filter(Boolean)
  // Deconstruct each text line into a nice JSON object
  .map(line => {
    const lineSplit = line.split(',< Location:');
    return {
      phone_number: lineSplit[0],
      url: lineSplit[1].trim(),
    };
  })


const main = () => {
  // Function is not async seemingly due to https://github.com/knex/knex/issues/4125

  // Define counters
  let newEntries = 0;
  let skippedEntries = 0;
  
  // Loop through each entry and add it to the DB if not already present
  return Bluebird.each(fileEntries, async function(e){
    const res = await knex('data').select().first().where('phone_number',e.phone_number);
    if(res === undefined){
      await knex('data').insert({
        phone_number: e.phone_number,
        url: e.url,
        survey_completed: false,
        out_of_target: false
      })
      newEntries++;
    }
    else {
      skippedEntries++;
    }
  })
  .then(() => {
    // Output some ingestion info
    console.log({newEntries,skippedEntries})
  })
  .then(async () => {
    // Find entries in DB without name data
    const pendingParse = await knex('data').select()
      .where('extracted_name', null)
      .andWhere('survey_completed', false)
      .andWhere('out_of_target', false)
    console.log('Processing', pendingParse.length, 'items');

    // Loop through each entry
    return Bluebird.each(pendingParse, async function(e){
      try {
        const dbdata = await knex('data').select().first().where('phone_number', e.phone_number);
        const result = await processEntry(dbdata);
        if(result && result.error && result.survey_completed){
          // Save results to DB
          await knex('survey_results').insert({ phone_number: e.phone_number, result_data: JSON.stringify(result.interview_items) });
          // Mark survey as complete
          await knex('data').update({ survey_completed: true, saved_results: true }).where('phone_number', e.phone_number);
        }
        else if(result && result.error && result.out_of_target){
          // Mark survey as complete
          await knex('data').update({ out_of_target: true }).where('phone_number', e.phone_number);
        }
        else {
          await knex('data').update({ extracted_name: result.extracted_name }).where('phone_number', result.phone_number);
          console.log('Processed', result.phone_number);
        }
      }
      catch(err){
        console.error(err);
        console.error(`Unexpected error while processing ${e.phone_number}`);
      }
    })
  })
  .then(async () => {
    // Fetch items again, but this time look for survey completions without data
    const pendingParse = await knex('data').select()
      .where('survey_completed', true)
      .andWhere('saved_results', false);
    console.log('Re-processing', pendingParse.length, 'completed items');

    // Loop through each entry
    return Bluebird.each(pendingParse, async function(e){
      try {
        const dbdata = await knex('data').select().first().where('phone_number', e.phone_number);
        const result = await processEntry(dbdata);
        if(result && result.error && result.survey_completed){
          // Save results to DB
          await knex('survey_results').insert({ phone_number: e.phone_number, result_data: JSON.stringify(result.interview_items) });
          // Mark results as saved
          await knex('data').update({ saved_results: true }).where('phone_number', e.phone_number);
        }
      }
      catch(err){
        console.error(err);
        console.error(`Unexpected error while processing ${e.phone_number}`);
      }
    })

  })
  
}

Promise.resolve()
.then(() => (
  knex.migrate.latest().then(() => {
    return main()
      .then(() => knex.destroy())
  })
))

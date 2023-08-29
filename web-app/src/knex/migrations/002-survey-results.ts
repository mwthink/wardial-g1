exports.up = async (knex) => {
  await knex.schema.table('data', table => {
    table.boolean('saved_results').defaultTo(false);
  })

  return await knex.schema.createTable('survey_results', table => {
    table.string('phone_number').primary().unique().notNullable();
    table.json('result_data').notNullable();
  })
}

exports.down = async (knex) => {
  await knex.schema.table('data', table => {
    table.dropColumn('saved_results');
  })
  return knex.schema.dropTable('survey_results');
}

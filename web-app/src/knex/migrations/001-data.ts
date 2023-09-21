exports.up = async (knex) => {
  return await knex.schema.createTable('data', table => {
    table.string('phone_number').primary().notNullable();
    table.string('extracted_name');
    table.text('url');
    table.boolean('survey_completed').defaultTo(false);
    table.boolean('out_of_target').defaultTo(false);
  })
}

exports.down = async (knex) => {
  return knex.schema.dropTable('data');
}

import * as Http from 'http';
import * as Path from 'path';
import Knex from 'knex';
import * as Express from 'express';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { HtmlPage, SurveyResultsView } from './ui';

const app = Express();
const httpServer = Http.createServer(app);

// Setup database
const knex = Knex({
  client: 'sqlite3',
  useNullAsDefault: false,
  connection: {
    filename: Path.resolve(__dirname, '../../db.sqlite')
  }
})

// Define HTTP routes
app.get('/', async (req, res, next) => {
  return res.redirect('/datas');
})

app.get('/data/:phoneNumber', async (req, res, next) => {
  const datas = await knex('data').select().first()
    .where('phone_number', req.params.phoneNumber);
  
  let surveyData = null;
  // If there is saved survey data, fetch it
  if(datas.survey_completed && datas.saved_results){
    surveyData = await knex('survey_results').select('result_data').first()
      .where('phone_number', req.params.phoneNumber);
  }
  
  const pageHtml = renderToStaticMarkup(
    <HtmlPage title='Wardial Web View'>
      <pre>{JSON.stringify(datas, null, 2)}</pre>
      { Boolean(surveyData) ? <hr/> : null }
      { Boolean(surveyData) ? <SurveyResultsView survey_results={JSON.parse(surveyData.result_data)}/> : null }
    </HtmlPage>
  )
  return res.contentType('html').send(pageHtml);
})

app.get('/datas', async (req, res, next) => {
  const datas = await knex('data').select('phone_number', 'survey_completed', 'out_of_target')
    .whereLike('phone_number', `${req.query.phone_prefix}%`);
  
  const pageHtml = renderToStaticMarkup(
    <HtmlPage title='Wardial Web View'>
      <form method='get'>
        <input required name="phone_prefix" placeholder='Phone number prefix' defaultValue={req.query.phone_prefix as string}/>
        <button type="submit">Search</button>
      </form>
      <ul>
        {datas.map(d => (
          <li key={d.phone_number}><a href={`/data/${d.phone_number}`}>{d.phone_number}</a></li>
        ))}
      </ul>
    </HtmlPage>
  )
  return res.contentType('html').send(pageHtml);
})

// Start the server listening
httpServer.listen(3000, () => {
  console.log('HTTP server on port', 3000);
})

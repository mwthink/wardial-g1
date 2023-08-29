import * as Http from 'http';
import * as Path from 'path';
import Knex from 'knex';
import * as Express from 'express';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Form, Input, Button } from 'reactstrap';

import { HtmlPage, SurveyResultsView, PhoneEntryView } from './ui';

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
      { Boolean(surveyData) ? <SurveyResultsView survey_results={JSON.parse(surveyData.result_data)}/> : null }
    </HtmlPage>
  )
  return res.contentType('html').send(pageHtml);
})

app.get('/datas', async (req, res, next) => {
  const datas = await knex('data').select()
    .whereLike('phone_number', `${req.query.phone_prefix}%`);
  
  const pageHtml = renderToStaticMarkup(
    <HtmlPage title='Wardial Web View'>
      <Form method='get'>
        <Input required name="phone_prefix" placeholder='Phone number prefix' defaultValue={req.query.phone_prefix as string}/>
        <Button type="submit">Search</Button>
      </Form>
      <PhoneEntryView data={datas}/>
    </HtmlPage>
  )
  return res.contentType('html').send(pageHtml);
})

app.get('/summary/survey', async (req, res, next) => {
  // Gather all survey data
  const datas = await knex('survey_results').select('result_data');
  // Parse all the JSON values that were returned, reduce into a flat array of answers
  const surveyAnswers: {question_text:string,options:string[],answer:string}[] = datas
    .map(d => JSON.parse(d.result_data))
    .reduce((acc, answers) => acc.concat(answers), [])

  const surveySummary = surveyAnswers.reduce((acc, ans) => {
    return {
      ...acc,
      [ans.question_text]: {
        // Spread the existing values, or set blank/default if none
        ...(acc[ans.question_text] || {}),
        // Add 1 to either the previous value or zero
        [ans.answer]: ((acc[ans.question_text] || {})[ans.answer] || 0) + 1
      }
    }
  }, {})

  const pageHtml = renderToStaticMarkup(
    <HtmlPage title='Wardial Web View'>
      {Object.keys(surveySummary).map((qK, qI) => (
        <div key={qK}>
          {qK
            .replace(/<br>/g, '\n')
            .replace(/<b>/g, '*')
            .replace(/<\/b>/g, '*')
            .split('\n').map((v, vI) => (
            <h4 key={[qI,vI].join('-')}>{v}</h4>
          ))}
          {Object.keys(surveySummary[qK]).map((aK, aI) => (
            <div key={aI}>
              <strong>{aK}</strong> - {surveySummary[qK][aK]}
            </div>
          ))}
          <hr/>
        </div>
      ))}
    </HtmlPage>
  )
  return res.contentType('html').send(pageHtml);
})

// Start the server listening
httpServer.listen(3000, () => {
  console.log('HTTP server on port', 3000);
})

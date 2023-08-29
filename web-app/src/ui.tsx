import * as React from 'react';
import { Table, Input } from 'reactstrap';

export const HtmlPage: React.FunctionComponent<React.PropsWithChildren<{title?:string}>> = (props) => {
  return (
    <html>
      <head>
        <title>{props.title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossOrigin="anonymous"></link>
      </head>
      <body>
        {props.children}
      </body>
    </html>
  )
}

export type PhoneEntryData = {
  phone_number: string;
  extracted_name?: string;
  url?: string;
  survey_completed?: boolean;
  out_of_target?: boolean;
  saved_results?: boolean;
}

export const SurveyResultsView: React.FunctionComponent<{survey_results:any[]}> = (props) => {
  return (
    <ul>
      {props.survey_results.map((r, i) => (
        <li key={i}><strong>{r.question_text}</strong> <i>{r.answer}</i></li>
      ))}
    </ul>
  )
}

export const PhoneEntryView: React.FunctionComponent<{data:PhoneEntryData[]}> = (props) => {
  return (
    <Table>
      <thead>
        <tr>
          <th>Phone Number</th>
          <th>Extracted Name</th>
          <th>Survey Completed?</th>
          <th>Out of Target Demographic?</th>
          <th>Survey Results</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map(d => (
          <tr key={d.phone_number}>
            <td>{d.phone_number}</td>
            <td>{d.extracted_name}</td>
            <td><Input type="checkbox" readOnly={true} disabled={true} checked={Boolean(d.survey_completed)}/></td>
            <td><Input type="checkbox" readOnly={true} disabled={true} checked={Boolean(d.out_of_target)}/></td>
            <td>{ Boolean(d.saved_results) ? <a href={`/data/${d.phone_number}`}>Answers</a> : 'N/A' }</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

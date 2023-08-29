import * as React from 'react';

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


export const SurveyResultsView: React.FunctionComponent<{survey_results:any[]}> = (props) => {
  return (
    <ul>
      {props.survey_results.map((r, i) => (
        <li key={i}><strong>{r.question_text}</strong> <i>{r.answer}</i></li>
      ))}
    </ul>
  )
}

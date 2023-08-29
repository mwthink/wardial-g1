const Axios = require('axios');
const cheerio = require('cheerio');

const formPostRequest = (url, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(k => {
    formData.append(k, data[k]);
  })

  return Axios.post(url, formData, {
    // headers: {
    //   'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
    // }
  })
}

exports.processEntry = async (entry) => {
  // Folow the scraped redirect
  const resp = await Axios.get(entry.url);
  if(resp.request._redirectable._currentUrl.includes('out_of_target')){
    console.error(`Survey was out of target for ${entry.phone_number}`);
    return { error: true, out_of_target: true };
  }
  
  // Get the URL we have been directed to as our base URL
  const surveyUrl = resp.request._redirectable._currentUrl.split('/survey/')[0]; // https://g1.cawi.idsurvey.com/(S(jzrcqqslwufixsswllzhupew))

  // Perform the "start_interview" call
  const startInterview = await formPostRequest(`${surveyUrl}/connectors_sessions.axd`, {
    _type: 'action',
    _action: 'start_interview',
    _param: JSON.stringify("{}"),
  })

  // If we got a 200 response, we can fetch the survey
  if(startInterview.data.status == 200){
    // Fetch the survey content page
    const surveyPage = await Axios.get(`${surveyUrl}/survey/${startInterview.data.path}.cshtml`);

    // Load the HTML into cheerio
    const surveyPageHtml = surveyPage.data;

    // Select the contents of the #brand element (where name is stored) and trim the empty space
    const $ = cheerio.load(surveyPageHtml);
    const extractedName = cheerio.text($('#brand')).trim();

    // Return the final data
    return {
      phone_number: entry.phone_number,
      extracted_name: extractedName,
    };
  }
  else if(typeof startInterview.data == 'string' && startInterview.data.includes('The survey has already been completed')){
    console.error(`Survey already completed for ${entry.phone_number}`);
    return { error: true, survey_completed: true };
  }
  // TODO handle timeout
  else {
    console.log(`StartInterview received unexpected status code:`, startInterview.data.status);
    // console.log(startInterview.data);
    // console.log(startInterview);
    console.error({entry})
  }

}

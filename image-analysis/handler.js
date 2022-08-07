const AWS = require('aws-sdk');
const axios = require('axios');

class Handler {
  constructor({ rekognition, translator }) {
    this.rekognition = rekognition;
    this.translator = translator;
  }

  async loadImageBuffer(imageUrl) {
    const { data } = await axios.get(imageUrl, { 
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(data, 'base64');
  }

  async translateText(text) {
    const { TranslatedText } = await this.translator.translateText({
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text,
    }).promise();

    return TranslatedText.split(' e ');
  }

  async detectImages(buffer) {
    const result = await this.rekognition.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise();

    const workingItems = result.Labels.filter(({ Confidence }) => Confidence > 80);
    const labels = workingItems.map(({ Name }) => Name).join(' and ')

    return { workingItems, labels };
  }

  async main(event) {
    try {
      const { imageUrl } = event.queryStringParameters;
      const imageBuffer = await this.loadImageBuffer(imageUrl);
      console.log('Loading image...');

      const { workingItems, labels } = await this.detectImages(imageBuffer);
      console.log('Detecting labels...');
      
      console.log('Translating to portuguese...');      
      const translatedText = await this.translateText(labels)
      const result = translatedText
        .map((label, index) => 
        `Ele tem ${workingItems[index].Confidence.toFixed(2)}% de chance de ser ${label}`)
        .join('\n');

      console.log('Finished!');

      return {
        statusCode: 200,
        body: JSON.stringify({
          result,
        })
      }
    } catch (err) {
      console.error(err);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: err.message,
          body: 'Internal server error'
        })
      }
    }
  }
}

const rekognition = new AWS.Rekognition()
const translator = new AWS.Translate()
const handler = new Handler({
  rekognition,
  translator,
});

module.exports.main = handler.main.bind(handler);
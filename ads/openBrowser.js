import axios from 'axios';
import logger from '../logger/logger.js';

const adsOpenBrowser = async (userId) => {
  logger.info('adsOpenBrowser');
  try {
    const { data } = await axios(`http://local.adspower.net:50325/api/v1/browser/start?user_id=${userId}`);
    logger.info('adsOpenBrowser');
    console.log(data);
    return data;
  } catch (e) {
    logger.error(e);
    return null;
  }
};

export default adsOpenBrowser;

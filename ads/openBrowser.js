import axios from 'axios';
import logger from '../logger/logger';

const adsOpenBrowser = async (userId) => {
  try {
    const { data } = await axios(`http://local.adspower.net:50325/api/v1/browser/start?user_id=${userId}`);
    return data;
  } catch (e) {
    logger.error(e);
    return null;
  }
};

export default adsOpenBrowser;

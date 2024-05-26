import axios from 'axios';

const adsOpenBrowser = async (userId) => {
  const { data } = await axios(`http://local.adspower.net:50325/api/v1/browser/start?user_id=${userId}`);
  return data;
};

export default adsOpenBrowser;

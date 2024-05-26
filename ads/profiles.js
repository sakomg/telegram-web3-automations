import axios from 'axios';

const adsMobileProfile = async () => {
  let result = [];
  const options = {
    method: 'GET',
    url: 'http://local.adspower.net:50325/api/v1/user/list?page=1&page_size=10',
  };

  try {
    const { data } = await axios(options);
    result = data?.data?.list.map((el) => (el.name.includes('Mobile') ? el.user_id : null)).filter((el) => el !== null);
  } catch (e) {
    console.log('ads: error in fetching profiles', e);
  }

  if (!result.length) {
    throw new Error('firstly create Mobile profile in ADS');
  }

  return result[0];
};

export default adsMobileProfile;

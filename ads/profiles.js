import axios from 'axios';

const ADS_API_URL = 'http://local.adspower.net:50325/api';
const ADS_API_VERSION = 'v1';

export const getGeneralProfile = async () => {
  const result = { success: true, message: null };
  const options = {
    method: 'GET',
    url: `${ADS_API_URL}/${ADS_API_VERSION}/user/list?page=1&page_size=10`,
  };

  try {
    const { data } = await axios(options);
    const profiles = data?.data?.list.map((el) => (el.name.includes('General') ? el.user_id : null)).filter((el) => el !== null);
    if (profiles.length) {
      result.success = true;
      result.message = profiles[0];
    } else {
      result.success = false;
      result.message = 'Firstly create "General" profile in ADS';
    }
  } catch (e) {
    result.success = false;
    result.message = 'Error in fetching profiles ' + e;
  }

  return result;
};

export const updateProfileProxy = async (userId, options) => {
  const result = { success: true, message: null };
  try {
    // TODO: fingerprint_config: {}
    const data = {
      user_id: userId,
      user_proxy_config: {
        proxy_soft: options.soft,
        proxy_type: options.type,
        proxy_host: options.host,
        proxy_port: options.port,
        proxy_user: options.user,
        proxy_password: options.password,
      },
    };

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };

    const response = await fetch(`${ADS_API_URL}/${ADS_API_VERSION}/user/update`, requestOptions);
    const json = await response.json();

    const responseObject = JSON.parse(JSON.stringify(json));

    if (responseObject.code != 0) {
      result.success = false;
      result.message = json;
    }

    result.message = json;
    result.success = true;
  } catch (error) {
    result.success = false;
    result.message = error;
  }

  return result;
};

function currentTime(format = 'string') {
  let tz_offset = new Date().getTimezoneOffset() * 60000;

  if (format === 'json') {
    return new Date(Date.now() - tz_offset).toISOString();
  }

  if (format === 'timestamp') {
    return new Date(Date.now() - tz_offset).getTime();
  }

  return new Date(Date.now() - tz_offset).toISOString().slice(0, -5).replace('T', ' ');
}

export default currentTime;

/* eslint-disable camelcase */
const axios = require('axios');

exports.facebook = async (access_token) => {
  const fields = 'id, name, email, picture';
  const url = 'https://graph.facebook.com/me';
  const params = { access_token, fields };
  const response = await axios.get(url, { params });
  const {
    id, name, email, picture,
  } = response.data;
  return {
    service: 'facebook',
    picture: picture.data.url,
    id,
    name,
    email,
  };
};

exports.google = async (access_token) => {
  const url = 'https://www.googleapis.com/oauth2/v3/userinfo';
  const params = { access_token };
  const response = await axios.get(url, { params });
  const {
    sub, name, email, picture,
  } = response.data;
  return {
    service: 'google',
    picture,
    id: sub,
    name,
    email,
  };
};

exports.twitch = async (access_token) => {
  const url = 'https://id.twitch.tv/oauth2/userinfo';
  const params = { access_token };
  const response = await axios.get(url, { params });
  const {
    sub, preferred_username, email, picture,
  } = response.data;
  return {
    service: 'twitch',
    picture,
    id: sub,
    name: preferred_username,
    email,
  };
};

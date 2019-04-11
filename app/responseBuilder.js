const _ = require("lodash");

// Build response for slack.
// @see https://api.slack.com/tools/block-kit-builder
const searchResponse = images => {
  const imagesResponse = _imagesResponse(images);
  return JSON.stringify({
    response_type: "ephemeral",
    blocks: [...imagesResponse]
  });
};

const randomResponse = ({
  title,
  imageUrl
}) => {
  return JSON.stringify({
    response_type: "ephemeral",
    blocks: [{
        type: "image",
        title: {
          type: "plain_text",
          text: title,
          emoji: true
        },
        image_url: imageUrl,
        alt_text: title
      },
      {
        type: "actions",
        elements: [{
            type: "button",
            text: {
              type: "plain_text",
              text: "送る",
              emoji: true
            },
            value: imageUrl
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "もう一度",
              emoji: true
            },
            value: "RETRY_RANDOM"
          }
        ]
      }
    ]
  });
};

const _imagesResponse = images => {
  const imageResponses = images.map(({
    imageUrl,
    title
  }) => [{
      type: "image",
      title: {
        type: "plain_text",
        text: title,
        emoji: true
      },
      image_url: imageUrl,
      alt_text: title
    },
    {
      type: "actions",
      elements: [{
        type: "button",
        text: {
          type: "plain_text",
          text: "送る",
          emoji: true
        },
        value: imageUrl
      }]
    }
  ]);
  return _.flatten(imageResponses);
};

const sendImageResponse = req => {
  const {
    actions,
    user
  } = JSON.parse(req.body.payload);
  const action = actions[0];
  return JSON.stringify({
    response_type: "in_channel",
    delete_original: true,
    blocks: [{
        type: "context",
        elements: [{
          type: "mrkdwn",
          text: `From ${user.username}`
        }]
      },
      {
        type: "image",
        image_url: action.value,
        alt_text: "いらすとやや"
      }
    ]
  });
};

// error responses
const notFound = () => {
  return JSON.stringify({
    response_type: "ephemeral",
    blocks: [{
      type: "image",
      title: {
        type: "plain_text",
        text: "404 検索結果が見つかりません。",
        emoji: true
      },
      image_url: "https://1.bp.blogspot.com/-lGOEBC53sNk/WvQHXNpNfiI/AAAAAAABL6I/EF8b66sqJicObf9JkISl-cuvfc5m4EUrACLcBGAs/s400/internet_404_page_not_found_j.png",
      alt_text: "Example Image"
    }]
  });
};

const internalServerError = () => {
  return JSON.stringify({
    response_type: "ephemeral",
    blocks: [{
      type: "image",
      title: {
        type: "plain_text",
        text: "500 インターナルサーバーエラー",
        emoji: true
      },
      image_url: "https://4.bp.blogspot.com/-97ehmgQAia0/VZt5RUaiYsI/AAAAAAAAu24/yrwP694zWZA/s400/computer_error_bluescreen.png",
      alt_text: "ブルースクリーンのイラスト"
    }]
  });
};

module.exports = {
  searchResponse,
  randomResponse,
  notFound,
  internalServerError,
  sendImageResponse
};
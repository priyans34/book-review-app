import Contentstack from "contentstack";

const Stack = Contentstack.Stack({
  api_key: process.env.REACT_APP_CS_API_KEY,
  delivery_token: process.env.REACT_APP_CS_DELIVERY_TOKEN,
  environment: process.env.REACT_APP_CS_ENVIRONMENT,
  branch: "main",
});

// Set the CDN host for dev11 non-production environment
Stack.setHost("dev11-cdn.csnonprod.com");

export { Stack };

import development from "./development.config";
import production from "./production.config";
import example from "./example.config";
const env = process.env.APP_ENV || 'production';

const config = {
  example,
  development,
  production
};

export default config[env];

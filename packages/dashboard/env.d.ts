declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        CALENDAR_ID?: string;

        OPEN_WEATHER_MAP_API_KEY?: string;
        OPEN_WEATHER_MAP_LOCATION_NAME?: string;

        SCREENSHOT_PATH?: string;

        SERVER_PORT?: string;
      }
    }
  }
}

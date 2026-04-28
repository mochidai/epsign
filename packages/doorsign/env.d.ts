declare module "process" {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        GOOGLE_CALENDAR_ID?: string;
        GOOGLE_API_KEY?: string;
        SERVER_PORT?: string;
      }
    }
  }
}

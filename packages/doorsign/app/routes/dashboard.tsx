import { useLoaderData } from "@remix-run/react";
import fs from "node:fs";

type BusyEvent = {
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
};

type HolidayEvent = {
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
};

type OverrideState = {
  override: "force_off" | null;
};

type LocationState = {
  date: string;
  location: "on_campus" | "off_campus";
};

export const loader = async () => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  let events: BusyEvent[] = [];
  let holidays: HolidayEvent[] = [];

  try {
    events = calendarId ? await getCalendarBusyEvents(calendarId) : [];
  } catch (e) {
    console.error("Failed to fetch busy events:", e);
    events = [];
  }

  try {
    holidays = await getJapaneseHolidayEvents();
  } catch (e) {
    console.error("Failed to fetch holidays:", e);
    holidays = [];
  }

  return {
    events,
    holidays,
    overrideState: getOverrideState(),
    locationState: getLocationState(),
    updatedAt: new Date().toISOString(),
  };
};

export default function Dashboard() {
  const { events, holidays, overrideState, locationState, updatedAt } = useLoaderData<typeof loader>();

  const now = new Date();

  const currentEvent = events.find((e) => {
    return new Date(e.start.dateTime) <= now && now < new Date(e.end.dateTime);
  });

  const nextEvent = events.find((e) => {
    return now < new Date(e.start.dateTime);
  });

  const isBusy = Boolean(currentEvent);
  const isHoliday = isTodayHoliday(now, holidays);
  const isOutsideHours = isOutsideOfficeHours(now, isHoliday);
  const showLocation = isWithinLocationDisplayHours(now);

  const isManualBusy = overrideState.override === "force_off";

  let statusText = "対応可";
  let subText = "";
  let mainEvent = currentEvent ?? nextEvent;

  if (isOutsideHours) {
    statusText = "対応不可";
    subText = isHoliday ? "祝日・時間外 Off" : "時間外 Off";
  } else if (isManualBusy) {
    statusText = "対応不可";
    subText = "作業中 Busy";
  } else if (isBusy && currentEvent) {
    statusText = "対応不可";
    subText = `予定あり（〜${formatTime(currentEvent.end.dateTime)}）`;
  } else {
    statusText = "対応可";

    if (showLocation) {
      subText = locationState.location === "on_campus" ? "学内にいます" : "学外・リモートです";
    }
  }

  return (
    <div className="w-[1360px] h-[480px] overflow-hidden bg-white text-black">
      <div className="w-full h-full flex gap-4 p-4 box-border">
        <section className="w-[660px] h-full border-2 border-black rounded-sm p-6 flex flex-col justify-between box-border">
          <div className="text-center">
            <div className="text-[120px] font-bold leading-none text-black">
              {statusText}
            </div>

            <div className="text-[40px] font-bold mt-4 text-black">
              {subText}
            </div>
          </div>

          <div>
            <div className="border-t-[4px] pt-2 border-black">
              <div className="text-[30px] font-bold text-black">
                {currentEvent ? "現在の予定" : "次の予定"}
              </div>

              {mainEvent ? (
                <>
                  <div className="text-[32px] font-bold mt-1 leading-tight whitespace-nowrap">
                    {formatDateWithWeekday(mainEvent.start.dateTime)}{" "}
                    {formatTime(mainEvent.start.dateTime)}〜{formatTime(mainEvent.end.dateTime)}
                  </div>
                  <div className="text-[26px] font-bold mt-1">予定あり</div>
                </>
              ) : (
                <div className="text-[32px] font-bold mt-2">現在、予定はありません</div>
              )}
            </div>

            <div className="border-t-2 border-gray-300 mt-3 pt-2 text-[26px] font-bold">
              最終更新 {formatTime(updatedAt)}
            </div>
          </div>
        </section>

        <section className="w-[652px] h-full border-2 border-black rounded-sm flex flex-col box-border">
          <div className="h-[76px] border-b-2 border-black flex items-center justify-center text-[40px] font-bold">
            今後の予定
          </div>

          <div className="flex-1 p-5 overflow-hidden">
            <EventList events={events} />
          </div>
        </section>
      </div>
    </div>
  );
}

function EventList({ events }: { events: BusyEvent[] }) {
  if (!events.length) {
    return <div className="h-full flex items-center justify-center text-[36px] font-bold">予定なし</div>;
  }

  return (
    <div className="text-[27px] font-bold leading-[1.22]">
      {events.slice(0, 7).map((e, index) => (
        <div
          key={`${e.start.dateTime}-${index}`}
          className="py-[8px] border-b border-dashed border-gray-400 last:border-b-0 whitespace-nowrap"
        >
          {formatDateWithWeekday(e.start.dateTime)}{" "}
          {formatTime(e.start.dateTime)}〜{formatTime(e.end.dateTime)} 予定あり
        </div>
      ))}
    </div>
  );
}

async function getCalendarBusyEvents(calendarId: string): Promise<BusyEvent[]> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  const now = new Date();
  const timeMin = now.toISOString();

  const timeMaxDate = new Date(now);
  timeMaxDate.setDate(timeMaxDate.getDate() + 7);
  const timeMax = timeMaxDate.toISOString();

  const res = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: "Asia/Tokyo",
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const busy = data.calendars?.[calendarId]?.busy ?? [];

  return busy.map((b: { start: string; end: string }) => ({
    summary: "予定あり",
    start: { dateTime: b.start },
    end: { dateTime: b.end },
  }));
}

async function getJapaneseHolidayEvents(): Promise<HolidayEvent[]> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  const calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  const now = new Date();

  const timeMin = getJstDayStartUtcIso(now, 0);
  const timeMax = getJstDayStartUtcIso(now, 1);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
    `?key=${apiKey}` +
    `&timeMin=${encodeURIComponent(timeMin)}` +
    `&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true` +
    `&orderBy=startTime` +
    `&timeZone=Asia%2FTokyo`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  return data.items ?? [];
}

function getOverrideState(): OverrideState {
  const homeDir = process.env.HOME ?? "/home/pi";
  const overridePath = `${homeDir}/override.json`;

  try {
    const raw = fs.readFileSync(overridePath, "utf-8");
    return JSON.parse(raw) as OverrideState;
  } catch {
    return { override: null };
  }
}

function getLocationState(): LocationState {
  const today = formatJstDate(new Date());
  const homeDir = process.env.HOME ?? "/home/pi";
  const locationStatePath = `${homeDir}/location_state.json`;

  try {
    const raw = fs.readFileSync(locationStatePath, "utf-8");
    const state = JSON.parse(raw) as LocationState;

    if (state.date !== today) {
      return { date: today, location: "off_campus" };
    }

    return state;
  } catch {
    return { date: today, location: "off_campus" };
  }
}

function isOutsideOfficeHours(value: Date, isHoliday: boolean) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekday = parts.find((p) => p.type === "weekday")?.value;

  const isWeekend = weekday === "土" || weekday === "日";
  const totalMinutes = hour * 60 + minute;
  const isTimeOutside = totalMinutes < 9 * 60 || totalMinutes >= 17 * 60;

  return isWeekend || isHoliday || isTimeOutside;
}

function isWithinLocationDisplayHours(value: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const totalMinutes = hour * 60 + minute;

  return totalMinutes >= 9 * 60 && totalMinutes < 17 * 60;
}

function isTodayHoliday(value: Date, holidays: HolidayEvent[]) {
  const today = formatJstDate(value);

  return holidays.some((holiday) => {
    const holidayDate = holiday.start.date ?? (holiday.start.dateTime ? formatJstDate(new Date(holiday.start.dateTime)) : "");
    return holidayDate === today;
  });
}

function getJstDayStartUtcIso(value: Date, dayOffset: number) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day + dayOffset, -9, 0, 0)).toISOString();
}

function formatJstDate(value: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDateWithWeekday(value: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date(value));

  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const weekday = parts.find((p) => p.type === "weekday")?.value;

  return `${month}/${day}(${weekday})`;
}

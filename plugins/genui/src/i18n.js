import { getLocale } from "@upstream/i18n/runtime.ts";

const en = { loading: "Rendering…", sending: "Sending…", accepted: "Accepted by the session", error: "GenUI could not render" };
const zh = { loading: "正在渲染…", sending: "正在发送…", accepted: "会话已接收", error: "GenUI 无法渲染" };

export function copy(key) { return (getLocale() === "zh" ? zh : en)[key]; }

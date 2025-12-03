"use client";

import { useState, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { DatePicker as AntdDatePicker } from "antd";
import { DatetimePicker as VantDatePicker } from "react-vant";
import "react-vant/lib/index.css";

interface DateTimeFieldProps {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
}

// 简单的终端判断：移动端用原生控件，PC 交给 antd
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent || "";
    setIsMobile(/Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(ua));
  }, []);

  return isMobile;
}

// 统一封装：内部维护本地日期 + 时间，外部只看到 ISO 字符串
export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const isMobile = useIsMobile();
  const parsed = value ? dayjs(value) : dayjs();
  const [localValue, setLocalValue] = useState<Dayjs>(parsed);

  const emitChange = (d: dayjs.Dayjs) => {
    if (!d.isValid()) return;
    setLocalValue(d);
    onChange(d.toDate().toISOString());
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      {isMobile ? (
        // 移动端：react-vant 日期时间选择
        <VantDatePicker
          type="datetime"
          popup={{ round: true }}
          value={localValue.toDate()}
          onConfirm={(date: Date) => emitChange(dayjs(date))}
        >
          {(val?: Date, _columns, actions) => (
            <button
              type="button"
              onClick={() => actions.open()}
              className="w-full px-3 py-2 text-left border border-slate-200 rounded-xl text-sm"
            >
              {dayjs(val ?? localValue).format("YYYY-MM-DD HH:mm")}
            </button>
          )}
        </VantDatePicker>
      ) : (
        // PC：antd 日期时间选择
        <AntdDatePicker
          showTime
          value={localValue}
          onChange={(d: Dayjs | null) => {
            if (!d) return;
            emitChange(d);
          }}
          format="YYYY-MM-DD HH:mm"
          className="w-full"
        />
      )}
      <p className="text-[10px] text-slate-400 mt-1">将按本地时间保存</p>
    </div>
  );
}

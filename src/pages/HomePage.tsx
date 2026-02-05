import {Box, Stack, Typography} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';

import BirthdayInput from '../components/BirthdayInput';
import MonthGrid from '../components/MonthGrid';
import {addUser, getCurrentUser, updateUser} from '@/db/user';

const MAX_MONTHS = 30 * 30;

function getMonthIndex(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  return year * 12 + month + (day >= 15 ? 1 : 0);
}

function parseDateInput(value: string) {
  // 始终按“本地 00:00”构造
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
}

function roundTo(num: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(num * factor) / factor;
}

function monthsSinceBirth(birthdayValue: string, now: Date) {
  if (!birthdayValue) {
    return 0;
  }

  const birthday = new Date(`${birthdayValue}T00:00:00`);
  if (Number.isNaN(birthday.getTime())) {
    return 0;
  }

  const birthIndex = getMonthIndex(birthday);
  const nowIndex = getMonthIndex(now);
  return Math.max(0, nowIndex - birthIndex);
}

export default function HomePage() {
  const [birthdayValue, setBirthdayValue] = useState('');
  const [filledCount, setFilledCount] = useState(0);

  useEffect(() => {
    getCurrentUser().then(user => {
      console.log('user', user);
      if (user) {
        setBirthdayValue(toDateInputValue(user.birthday));
      }
    });
  }, []);

  useEffect(() => {
    const filledCount = Math.min(
      monthsSinceBirth(birthdayValue, new Date()),
      MAX_MONTHS,
    );
    setFilledCount(filledCount);
  }, [birthdayValue]);

  useEffect(() => {
    if (!birthdayValue) return;

    const birthdayDate = parseDateInput(birthdayValue);

    getCurrentUser().then(user => {
      if (user) {
        updateUser(user.id!, {birthday: birthdayDate});
      } else {
        addUser({name: '无名氏', birthday: birthdayDate, current: 1});
      }
    });
  }, [birthdayValue]);

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">九百宫格</Typography>
        <BirthdayInput value={birthdayValue} onChange={setBirthdayValue} />
        <Typography variant="body2" color="text.secondary">
          已经过了 {filledCount} 个月（按每月 15 号分割）
        </Typography>
        <Typography variant="body2" color="text.secondary">
          人们平均拥有七十五年的寿命，九百个月，一个三十乘上三十的网格。
        </Typography>
        {/* TODO： 为你的格子涂上不同的颜色，不同的颜色代表你的情绪 */}
        <Typography variant="body2" color="text.secondary">
          进度 {roundTo((filledCount / MAX_MONTHS) * 100, 2)} %
        </Typography>

        <MonthGrid filledCount={filledCount} />
      </Stack>
    </Box>
  );
}

import {TextField} from "@mui/material";

type BirthdayInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function BirthdayInput({value, onChange}: BirthdayInputProps) {
  return (
    <TextField
      label="生日"
      type="date"
      value={value}
      onChange={event => onChange(event.target.value)}
      InputLabelProps={{shrink: true}}
      fullWidth
    />
  );
}

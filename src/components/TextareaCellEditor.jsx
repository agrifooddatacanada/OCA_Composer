import React, { useState, useEffect, useRef, forwardRef } from "react";
import { MAX_ATTR_DESCRIPTION_CHARS } from "../constants/constants";
import { useImperativeHandle } from "react";

const textareaStyle = {
  width: "100%",
  height: "100%",
  resize: "none",
  outline: "none",
  border: "none",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: "12px",
  padding: "4px 6px",
  boxSizing: "border-box",
  lineHeight: "1.4"
};

const TextareaCellEditor = forwardRef((props, ref) => {
  const [value, setValue] = useState(
    props.charPress != null
      ? (props.value ?? "") + props.charPress
      : props.value
  );
  const textareaRef = useRef(null);
  const maxLength = props.cellEditorParams?.maxLength ?? MAX_ATTR_DESCRIPTION_CHARS;

  const startedWithCharPress = useRef(!!props.charPress);
  useEffect(() => {
    if (!startedWithCharPress.current) setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getValue() {
      return value;
    },
    isCancelBeforeStart() {
      return false;
    },
    isCancelAfterEnd() {
      return false;
    }
  }));

  return (
    <textarea
      ref={textareaRef}
      maxLength={maxLength}
      style={textareaStyle}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
});

export default TextareaCellEditor;

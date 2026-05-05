import React, { useState, useEffect, useRef, forwardRef } from "react";
import { MAX_ATTR_DESCRIPTION_CHARS } from "../constants/constants";
import { useImperativeHandle } from "react";
import { hasDisallowedChars } from "../utils/helpers";

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
  const [value, setValue] = useState(() => {
    // If the cell editor was opened via a key press, validate the character initially
    if (props.charPress != null) {
      const initialValue = (props.value ?? "") + props.charPress;
      if (
        (props.colDef?.field === "Attribute" || props.colDef?.field === "Name") &&
        hasDisallowedChars(initialValue)
      ) {
        if (props.context?.triggerInvalidCharModal) {
          // Wrap in a setTimeout so the context method is called after render cycle
          setTimeout(() => props.context.triggerInvalidCharModal(), 0);
        }
        return props.value ?? ""; // Reject the charPress, retain old value
      }
      return initialValue;
    }
    return props.value ?? "";
  });
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

  const handleChange = (e) => {
    const newValue = e.target.value;
    if ((props.colDef?.field === "Attribute" || props.colDef?.field === "Name") && hasDisallowedChars(newValue)) {
      if (props.context?.triggerInvalidCharModal) {
        props.context.triggerInvalidCharModal();
      }
      return;
    }
    setValue(newValue);
  };

  return (
    <textarea
      ref={textareaRef}
      maxLength={maxLength}
      style={textareaStyle}
      value={value}
      onChange={handleChange}
      autoComplete="off"
      spellCheck="false"
    />
  );
});

export default TextareaCellEditor;

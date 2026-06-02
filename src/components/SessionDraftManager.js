import React from "react";
import { useContext } from "react";
import { useMultiSchema } from "../schema/schemaContext";
import { Context } from "../App";
import { useSessionDraft } from "../hooks/useSessionDraft";
import DraftRestoreDialog from "./DraftRestoreDialog";

export default function SessionDraftManager() {
  const { schemaStates, currentSchemaId, ocaPackage } = useMultiSchema();
  const { currentPage } = useContext(Context);

  useSessionDraft({ schemaStates, currentSchemaId, ocaPackage, currentPage });

  return <DraftRestoreDialog />;
}

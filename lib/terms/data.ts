import "server-only";
import beApi from "@/data/terms/be-api.json";
import common from "@/data/terms/common.json";
import db from "@/data/terms/db.json";
import deploy from "@/data/terms/deploy.json";
import feBehavior from "@/data/terms/fe-behavior.json";
import feLayout from "@/data/terms/fe-layout.json";
import feUi from "@/data/terms/fe-ui.json";
import type { Term } from "@/lib/search/types";

// 용어 사전 페이지는 DB 대신 저장소의 사전 파일을 바로 읽는다 (빌드할 때 페이지를 미리 만든다).
export type DictionaryTerm = Term & { aliases: string[] };

export const ALL_TERMS: DictionaryTerm[] = [feUi, feLayout, feBehavior, beApi, db, deploy, common]
  .flat()
  .sort((a, b) => a.term.localeCompare(b.term, "ko"));

const byId = new Map(ALL_TERMS.map((t) => [t.id, t]));

export function getTerm(id: string): DictionaryTerm | undefined {
  return byId.get(id);
}

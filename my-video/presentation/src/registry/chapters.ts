import type { ChapterDef } from "./types";
import Coldopen from "../chapters/01-coldopen/Coldopen";
import "../chapters/01-coldopen/Coldopen.css";
import { narrations as coldopenNarrations } from "../chapters/01-coldopen/narrations";
import CoreCollection from "../chapters/02-core-collection/CoreCollection";
import "../chapters/02-core-collection/CoreCollection.css";
import { narrations as coreCollectionNarrations } from "../chapters/02-core-collection/narrations";
import OrganizeSearch from "../chapters/03-organize-search/OrganizeSearch";
import "../chapters/03-organize-search/OrganizeSearch.css";
import { narrations as organizeSearchNarrations } from "../chapters/03-organize-search/narrations";
import KnowledgeDiscovery from "../chapters/04-knowledge-discovery/KnowledgeDiscovery";
import "../chapters/04-knowledge-discovery/KnowledgeDiscovery.css";
import { narrations as knowledgeDiscoveryNarrations } from "../chapters/04-knowledge-discovery/narrations";
import AnalysisCompare from "../chapters/05-analysis-compare/AnalysisCompare";
import "../chapters/05-analysis-compare/AnalysisCompare.css";
import { narrations as analysisCompareNarrations } from "../chapters/05-analysis-compare/narrations";
import ReadingArchive from "../chapters/06-reading-archive/ReadingArchive";
import "../chapters/06-reading-archive/ReadingArchive.css";
import { narrations as readingArchiveNarrations } from "../chapters/06-reading-archive/narrations";
import BrowserExtension from "../chapters/07-browser-extension/BrowserExtension";
import "../chapters/07-browser-extension/BrowserExtension.css";
import { narrations as browserExtensionNarrations } from "../chapters/07-browser-extension/narrations";
import Architecture from "../chapters/08-architecture/Architecture";
import "../chapters/08-architecture/Architecture.css";
import { narrations as architectureNarrations } from "../chapters/08-architecture/narrations";

export const CHAPTERS: ChapterDef[] = [
  { id: "coldopen", title: "开门见痛点", narrations: coldopenNarrations, Component: Coldopen },
  { id: "core-collection", title: "核心收藏流", narrations: coreCollectionNarrations, Component: CoreCollection },
  { id: "organize-search", title: "组织与检索", narrations: organizeSearchNarrations, Component: OrganizeSearch },
  { id: "knowledge-discovery", title: "知识发现", narrations: knowledgeDiscoveryNarrations, Component: KnowledgeDiscovery },
  { id: "analysis-compare", title: "分析与对比", narrations: analysisCompareNarrations, Component: AnalysisCompare },
  { id: "reading-archive", title: "阅读与存档", narrations: readingArchiveNarrations, Component: ReadingArchive },
  { id: "browser-extension", title: "浏览器扩展", narrations: browserExtensionNarrations, Component: BrowserExtension },
  { id: "architecture", title: "架构与收尾", narrations: architectureNarrations, Component: Architecture },
];

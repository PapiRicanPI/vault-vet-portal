import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module) {
    var fs = __require("fs");
    var path = __require("path");
    var os = __require("os");
    var crypto3 = __require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text2) {
      return supportsAnsi() ? `\x1B[2m${text2}\x1B[0m` : text2;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse2(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto3.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse: parse2,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports, module) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports, module) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  brainExerciseLogs: () => brainExerciseLogs,
  creatorScanLeads: () => creatorScanLeads,
  depedSchools: () => depedSchools,
  donorContacts: () => donorContacts,
  donorPlatformEnum: () => donorPlatformEnum,
  donorStatusEnum: () => donorStatusEnum,
  eventCategoryEnum: () => eventCategoryEnum,
  evidenceTierEnum: () => evidenceTierEnum,
  exerciseTypeEnum: () => exerciseTypeEnum,
  exportLogs: () => exportLogs,
  focusSessions: () => focusSessions,
  invitations: () => invitations,
  mediaLeadRightsEnum: () => mediaLeadRightsEnum,
  mediaLeadSourceEnum: () => mediaLeadSourceEnum,
  mediaLeadStatusEnum: () => mediaLeadStatusEnum,
  mediaLeads: () => mediaLeads,
  mediaOutreachStatus: () => mediaOutreachStatus,
  mediaStatusEnum: () => mediaStatusEnum,
  researchEvents: () => researchEvents,
  researcherBookmarks: () => researcherBookmarks,
  researcherNotes: () => researcherNotes,
  researcherProjects: () => researcherProjects,
  researcherRecentlyViewed: () => researcherRecentlyViewed,
  researcherRoleEnum: () => researcherRoleEnum,
  researchers: () => researchers,
  roleEnum: () => roleEnum,
  scanLeadSourceEnum: () => scanLeadSourceEnum,
  scanLeadStatusEnum: () => scanLeadStatusEnum,
  schoolContacts: () => schoolContacts,
  schoolOutreachStatusEnum: () => schoolOutreachStatusEnum,
  tipCategoryEnum: () => tipCategoryEnum,
  tipPriorityEnum: () => tipPriorityEnum,
  tipStatusEnum: () => tipStatusEnum,
  tips: () => tips,
  users: () => users,
  vettingApplications: () => vettingApplications,
  vettingStatusEnum: () => vettingStatusEnum,
  vloggerInquiries: () => vloggerInquiries,
  vloggerInquiryStatusEnum: () => vloggerInquiryStatusEnum,
  vloggerPlatformEnum: () => vloggerPlatformEnum,
  volunteerApplications: () => volunteerApplications,
  volunteerRoleEnum: () => volunteerRoleEnum,
  volunteerStatusEnum: () => volunteerStatusEnum,
  weeklyOpsBlockEnum: () => weeklyOpsBlockEnum,
  weeklyOpsCompletions: () => weeklyOpsCompletions,
  weeklyOpsDayEnum: () => weeklyOpsDayEnum,
  weeklyOpsTasks: () => weeklyOpsTasks
});
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  json
} from "drizzle-orm/pg-core";
var roleEnum, vettingStatusEnum, researcherRoleEnum, tipCategoryEnum, tipStatusEnum, tipPriorityEnum, volunteerRoleEnum, volunteerStatusEnum, schoolOutreachStatusEnum, weeklyOpsDayEnum, weeklyOpsBlockEnum, exerciseTypeEnum, eventCategoryEnum, mediaStatusEnum, donorPlatformEnum, donorStatusEnum, vloggerPlatformEnum, evidenceTierEnum, vloggerInquiryStatusEnum, scanLeadSourceEnum, scanLeadStatusEnum, mediaLeadSourceEnum, mediaLeadRightsEnum, mediaLeadStatusEnum, users, vettingApplications, invitations, researchers, researcherBookmarks, researcherNotes, researcherProjects, researcherRecentlyViewed, tips, exportLogs, volunteerApplications, schoolContacts, weeklyOpsTasks, weeklyOpsCompletions, focusSessions, brainExerciseLogs, researchEvents, mediaOutreachStatus, donorContacts, vloggerInquiries, creatorScanLeads, mediaLeads, depedSchools;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    roleEnum = pgEnum("role", ["user", "admin"]);
    vettingStatusEnum = pgEnum("vetting_status", [
      "pending",
      "approved",
      "rejected",
      "needs_info",
      "user_downgraded"
    ]);
    researcherRoleEnum = pgEnum("researcher_role", [
      "observer",
      "researcher",
      "custodian",
      "admin"
    ]);
    tipCategoryEnum = pgEnum("tip_category", [
      "fraud",
      "misuse_of_funds",
      "false_claims",
      "identity",
      "network",
      "other"
    ]);
    tipStatusEnum = pgEnum("tip_status", ["new", "reviewing", "actioned", "closed"]);
    tipPriorityEnum = pgEnum("tip_priority", ["low", "medium", "high"]);
    volunteerRoleEnum = pgEnum("volunteer_role", [
      "osint_research_trainee",
      "data_verification_trainee",
      "digital_journalism_apprentice"
    ]);
    volunteerStatusEnum = pgEnum("volunteer_status", [
      "pending",
      "approved",
      "rejected",
      "needs_info"
    ]);
    schoolOutreachStatusEnum = pgEnum("school_outreach_status", [
      "not_sent",
      "sent",
      "responded",
      "no_reply",
      "meeting"
    ]);
    weeklyOpsDayEnum = pgEnum("weekly_ops_day", [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday"
    ]);
    weeklyOpsBlockEnum = pgEnum("weekly_ops_block", ["vetting", "platform"]);
    exerciseTypeEnum = pgEnum("exercise_type", [
      "memory",
      "pattern",
      "word_association",
      "breathing",
      "gratitude"
    ]);
    eventCategoryEnum = pgEnum("event_category", [
      "investigation",
      "interview",
      "deadline",
      "outreach",
      "review",
      "personal",
      "other"
    ]);
    mediaStatusEnum = pgEnum("media_status", [
      "not_sent",
      "sent",
      "responded",
      "no_reply",
      "meeting"
    ]);
    donorPlatformEnum = pgEnum("donor_platform", [
      "kofi",
      "buymeacoffee",
      "grant",
      "individual",
      "other"
    ]);
    donorStatusEnum = pgEnum("donor_status", [
      "new",
      "thanked",
      "follow_up_sent",
      "responded",
      "declined",
      "no_reply"
    ]);
    vloggerPlatformEnum = pgEnum("vlogger_platform", [
      "youtube",
      "tiktok",
      "facebook",
      "instagram",
      "other"
    ]);
    evidenceTierEnum = pgEnum("evidence_tier", [
      "confirmed_violation",
      "documented_evidence",
      "under_investigation"
    ]);
    vloggerInquiryStatusEnum = pgEnum("vlogger_inquiry_status", [
      "not_sent",
      "sent",
      "responded",
      "no_reply",
      "declined"
    ]);
    scanLeadSourceEnum = pgEnum("scan_lead_source", [
      "youtube",
      "google_news",
      "reddit",
      "vimeo"
    ]);
    scanLeadStatusEnum = pgEnum("scan_lead_status", [
      "new",
      "reviewing",
      "contacted",
      "archived"
    ]);
    mediaLeadSourceEnum = pgEnum("media_lead_source", [
      "Google News",
      "YouTube",
      "Reddit",
      "Google Web"
    ]);
    mediaLeadRightsEnum = pgEnum("media_lead_rights", [
      "Unknown",
      "Free to Use",
      "Copyrighted",
      "Fair Use"
    ]);
    mediaLeadStatusEnum = pgEnum("media_lead_status", [
      "Lead",
      "Verified",
      "Coded",
      "Archived"
    ]);
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: roleEnum("role").default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    vettingApplications = pgTable("vetting_applications", {
      id: serial("id").primaryKey(),
      displayName: varchar("displayName", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      profileUrl: text("profileUrl"),
      organization: varchar("organization", { length: 255 }),
      orgRole: varchar("orgRole", { length: 255 }),
      orgWebsite: text("orgWebsite"),
      priorWork: json("priorWork").$type(),
      investigationProject: text("investigationProject").notNull(),
      geographicFocus: varchar("geographicFocus", { length: 255 }).notNull(),
      outputType: varchar("outputType", { length: 100 }).notNull(),
      supportLink: text("supportLink"),
      agreesToCredit: integer("agreesToCredit").default(0).notNull(),
      underThreats: varchar("underThreats", { length: 50 }),
      useOpSec: integer("useOpSec").default(0),
      opSecTools: text("opSecTools"),
      previouslyDoxxed: varchar("previouslyDoxxed", { length: 50 }),
      emergencyContact: text("emergencyContact"),
      consentSafetyOutreach: integer("consentSafetyOutreach").default(0),
      agreesToTerms: integer("agreesToTerms").default(0).notNull(),
      agreesToPrivacy: integer("agreesToPrivacy").default(0).notNull(),
      referralSource: varchar("referralSource", { length: 255 }),
      willShareRawData: integer("willShareRawData").default(0),
      aiScore: integer("aiScore"),
      aiScoreIdentity: integer("aiScoreIdentity"),
      aiScoreOrganization: integer("aiScoreOrganization"),
      aiScorePurpose: integer("aiScorePurpose"),
      aiScoreSupport: integer("aiScoreSupport"),
      aiScoreRisk: integer("aiScoreRisk"),
      aiRationale: text("aiRationale"),
      aiRecommendation: varchar("aiRecommendation", { length: 20 }),
      lastEmailId: varchar("lastEmailId", { length: 64 }),
      lastEmailType: varchar("lastEmailType", { length: 30 }),
      lastEmailSentAt: timestamp("lastEmailSentAt"),
      emailOpenedAt: timestamp("emailOpenedAt"),
      status: vettingStatusEnum("status").default("pending").notNull(),
      adminNotes: text("adminNotes"),
      assignedRole: varchar("assignedRole", { length: 50 }),
      reviewedAt: timestamp("reviewedAt"),
      reviewedBy: integer("reviewedBy"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    invitations = pgTable("invitations", {
      id: serial("id").primaryKey(),
      email: varchar("email", { length: 320 }).notNull(),
      personalMessage: text("personalMessage"),
      sentAt: timestamp("sentAt").defaultNow().notNull(),
      sentBy: integer("sentBy"),
      token: varchar("token", { length: 64 }).notNull().unique(),
      usedAt: timestamp("usedAt")
    });
    researchers = pgTable("researchers", {
      id: serial("id").primaryKey(),
      vettingId: integer("vettingId"),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull().unique(),
      alias: varchar("alias", { length: 100 }),
      country: varchar("country", { length: 100 }),
      bio: text("bio"),
      organization: varchar("organization", { length: 255 }),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      role: researcherRoleEnum("role").default("observer").notNull(),
      foundingInvestigator: integer("foundingInvestigator").default(0).notNull(),
      foundingInvestigatorYear: integer("foundingInvestigatorYear"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastLoginAt: timestamp("lastLoginAt")
    });
    researcherBookmarks = pgTable("researcher_bookmarks", {
      id: serial("id").primaryKey(),
      researcherId: integer("researcherId").notNull(),
      caseId: varchar("caseId", { length: 100 }).notNull(),
      caseTitle: varchar("caseTitle", { length: 500 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    researcherNotes = pgTable("researcher_notes", {
      id: serial("id").primaryKey(),
      researcherId: integer("researcherId").notNull(),
      caseId: varchar("caseId", { length: 100 }).notNull(),
      note: text("note").notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    researcherProjects = pgTable("researcher_projects", {
      id: serial("id").primaryKey(),
      researcherId: integer("researcherId").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      caseIds: json("caseIds").$type().default([]),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    researcherRecentlyViewed = pgTable("researcher_recently_viewed", {
      id: serial("id").primaryKey(),
      researcherId: integer("researcherId").notNull(),
      caseId: varchar("caseId", { length: 100 }).notNull(),
      caseTitle: varchar("caseTitle", { length: 500 }),
      viewedAt: timestamp("viewedAt").defaultNow().notNull()
    });
    tips = pgTable("tips", {
      id: serial("id").primaryKey(),
      pseudonym: varchar("pseudonym", { length: 100 }),
      burnerEmail: varchar("burnerEmail", { length: 320 }),
      category: tipCategoryEnum("category").notNull(),
      subject: varchar("subject", { length: 500 }).notNull(),
      message: text("message").notNull(),
      fileUrl: varchar("fileUrl", { length: 1e3 }),
      fileKey: varchar("fileKey", { length: 500 }),
      fileName: varchar("fileName", { length: 255 }),
      ipHash: varchar("ipHash", { length: 64 }),
      status: tipStatusEnum("status").default("new").notNull(),
      priority: tipPriorityEnum("priority").default("low").notNull(),
      adminNotes: text("adminNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    exportLogs = pgTable("export_logs", {
      id: serial("id").primaryKey(),
      researcherId: integer("researcherId").notNull(),
      researcherAlias: varchar("researcherAlias", { length: 100 }).notNull(),
      caseId: varchar("caseId", { length: 100 }).notNull(),
      caseTitle: varchar("caseTitle", { length: 500 }),
      documentId: varchar("documentId", { length: 36 }).notNull().unique(),
      fileUrl: varchar("fileUrl", { length: 1e3 }),
      fileKey: varchar("fileKey", { length: 500 }),
      exportedAt: timestamp("exportedAt").defaultNow().notNull()
    });
    volunteerApplications = pgTable("volunteer_applications", {
      id: serial("id").primaryKey(),
      fullName: varchar("fullName", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      age: integer("age").notNull(),
      schoolName: varchar("schoolName", { length: 255 }).notNull(),
      gradeLevel: varchar("gradeLevel", { length: 50 }).notNull(),
      strand: varchar("strand", { length: 100 }),
      city: varchar("city", { length: 100 }).notNull(),
      role: volunteerRoleEnum("volunteerRole").notNull(),
      teacherName: varchar("teacherName", { length: 255 }).notNull(),
      teacherEmail: varchar("teacherEmail", { length: 320 }).notNull(),
      teacherSubject: varchar("teacherSubject", { length: 100 }),
      whyApply: text("whyApply").notNull(),
      relevantExperience: text("relevantExperience"),
      availabilityHoursPerWeek: integer("availabilityHoursPerWeek").notNull(),
      parentalConsentGiven: integer("parentalConsentGiven").default(0).notNull(),
      parentName: varchar("parentName", { length: 255 }),
      parentEmail: varchar("parentEmail", { length: 320 }),
      agreesToTerms: integer("agreesToTerms").default(0).notNull(),
      agreesToConfidentiality: integer("agreesToConfidentiality").default(0).notNull(),
      aiScore: integer("aiScore"),
      aiScoreMotivation: integer("aiScoreMotivation"),
      aiScoreReliability: integer("aiScoreReliability"),
      aiScoreSkillFit: integer("aiScoreSkillFit"),
      aiScoreAvailability: integer("aiScoreAvailability"),
      aiRationale: text("aiRationale"),
      aiRecommendation: varchar("aiRecommendation", { length: 20 }),
      status: volunteerStatusEnum("volunteerStatus").default("pending").notNull(),
      adminNotes: text("adminNotes"),
      hoursCompleted: integer("hoursCompleted").default(0),
      contributionSummary: text("contributionSummary"),
      certificateIssuedAt: timestamp("certificateIssuedAt"),
      certificateFileUrl: varchar("certificateFileUrl", { length: 1e3 }),
      certificateDocId: varchar("certificateDocId", { length: 20 }).unique(),
      ipHash: varchar("ipHash", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    schoolContacts = pgTable("school_contacts", {
      id: serial("id").primaryKey(),
      principalName: varchar("principalName", { length: 255 }).notNull(),
      schoolName: varchar("schoolName", { length: 255 }).notNull(),
      district: varchar("district", { length: 100 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      notes: text("notes"),
      status: schoolOutreachStatusEnum("schoolOutreachStatus").default("not_sent").notNull(),
      lastEmailedAt: timestamp("lastEmailedAt"),
      followUpDate: timestamp("followUpDate"),
      followUpSent: boolean("followUpSent").default(false).notNull(),
      followUpSentAt: timestamp("followUpSentAt"),
      replyNotes: text("replyNotes"),
      replyReceivedAt: timestamp("replyReceivedAt"),
      finalNudgeSent: boolean("finalNudgeSent").default(false).notNull(),
      finalNudgeSentAt: timestamp("finalNudgeSentAt"),
      internalNotes: text("internalNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    weeklyOpsTasks = pgTable("weekly_ops_tasks", {
      id: serial("id").primaryKey(),
      day: weeklyOpsDayEnum("day").notNull(),
      block: weeklyOpsBlockEnum("block").notNull(),
      label: varchar("label", { length: 255 }).notNull(),
      description: text("description"),
      sortOrder: integer("sortOrder").default(0).notNull(),
      isActive: integer("isActive").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    weeklyOpsCompletions = pgTable("weekly_ops_completions", {
      id: serial("id").primaryKey(),
      taskId: integer("taskId").notNull(),
      weekStart: varchar("weekStart", { length: 10 }).notNull(),
      completedAt: timestamp("completedAt").defaultNow().notNull()
    });
    focusSessions = pgTable("focus_sessions", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      sessionDate: varchar("sessionDate", { length: 10 }).notNull(),
      devotionVerseRef: varchar("devotionVerseRef", { length: 100 }),
      devotionVerseText: text("devotionVerseText"),
      devotionReflection: text("devotionReflection"),
      prayerText: text("prayerText"),
      devotionCompletedAt: timestamp("devotionCompletedAt"),
      sessionStartedAt: timestamp("sessionStartedAt"),
      sessionEndedAt: timestamp("sessionEndedAt"),
      totalMinutes: integer("totalMinutes").default(0),
      endOfDayAnswer: text("endOfDayAnswer"),
      closingVerseRef: varchar("closingVerseRef", { length: 100 }),
      closingVerseText: text("closingVerseText"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    brainExerciseLogs = pgTable("brain_exercise_logs", {
      id: serial("id").primaryKey(),
      sessionId: integer("sessionId").notNull(),
      exerciseType: exerciseTypeEnum("exerciseType").notNull(),
      prompt: text("prompt"),
      userResponse: text("userResponse"),
      completedAt: timestamp("completedAt").defaultNow().notNull()
    });
    researchEvents = pgTable("research_events", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      category: eventCategoryEnum("category").default("other").notNull(),
      startDate: varchar("startDate", { length: 10 }).notNull(),
      endDate: varchar("endDate", { length: 10 }).notNull(),
      startTime: varchar("startTime", { length: 5 }),
      endTime: varchar("endTime", { length: 5 }),
      allDay: integer("allDay").default(1).notNull(),
      caseRef: varchar("caseRef", { length: 255 }),
      completed: integer("completed").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    mediaOutreachStatus = pgTable("media_outreach_status", {
      id: serial("id").primaryKey(),
      contactNum: integer("contactNum").notNull().unique(),
      status: mediaStatusEnum("mediaStatus").default("not_sent").notNull(),
      lastContactedAt: timestamp("lastContactedAt"),
      responseNotes: text("responseNotes"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    donorContacts = pgTable("donor_contacts", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }),
      handle: varchar("handle", { length: 255 }),
      platform: donorPlatformEnum("donorPlatform").notNull(),
      tier: varchar("tier", { length: 100 }),
      amountUSD: varchar("amountUSD", { length: 50 }),
      status: donorStatusEnum("donorStatus").default("new").notNull(),
      lastContactedAt: timestamp("lastContactedAt"),
      followUpDate: timestamp("followUpDate"),
      replyNotes: text("replyNotes"),
      replyReceivedAt: timestamp("replyReceivedAt"),
      internalNotes: text("internalNotes"),
      grantOrg: varchar("grantOrg", { length: 255 }),
      grantDeadline: varchar("grantDeadline", { length: 10 }),
      grantAmount: varchar("grantAmount", { length: 100 }),
      grantUrl: varchar("grantUrl", { length: 1e3 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    vloggerInquiries = pgTable("vlogger_inquiries", {
      id: serial("id").primaryKey(),
      creatorName: varchar("creatorName", { length: 255 }).notNull(),
      channelName: varchar("channelName", { length: 255 }),
      platform: vloggerPlatformEnum("vloggerPlatform").default("youtube").notNull(),
      subscriberCount: varchar("subscriberCount", { length: 100 }),
      email: varchar("email", { length: 320 }),
      evidenceTier: evidenceTierEnum("evidenceTier").default("under_investigation").notNull(),
      violationDate: varchar("violationDate", { length: 50 }),
      agency: varchar("agency", { length: 255 }),
      violationSummary: text("violationSummary"),
      startYear: varchar("startYear", { length: 10 }),
      estimatedRevenue: varchar("estimatedRevenue", { length: 100 }),
      inquiryStatus: vloggerInquiryStatusEnum("inquiryStatus").default("not_sent").notNull(),
      dateSent: timestamp("dateSent"),
      deadline: timestamp("deadline"),
      sentLetterText: text("sentLetterText"),
      internalNotes: text("internalNotes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    creatorScanLeads = pgTable("creator_scan_leads", {
      id: serial("id").primaryKey(),
      source: scanLeadSourceEnum("source").notNull(),
      title: varchar("title", { length: 500 }).notNull(),
      url: varchar("url", { length: 1e3 }).notNull(),
      channelOrAuthor: varchar("channelOrAuthor", { length: 255 }),
      description: text("description"),
      thumbnail: varchar("thumbnail", { length: 1e3 }),
      publishedAt: varchar("publishedAt", { length: 100 }),
      keyword: varchar("keyword", { length: 255 }),
      leadStatus: scanLeadStatusEnum("leadStatus").default("new").notNull(),
      notes: text("notes"),
      savedAt: timestamp("savedAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    mediaLeads = pgTable("media_leads", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      url: text("url").notNull(),
      source: mediaLeadSourceEnum("source").notNull(),
      platform: varchar("platform", { length: 64 }),
      publishedAt: timestamp("publishedAt"),
      snippet: text("snippet"),
      rightsStatus: mediaLeadRightsEnum("rightsStatus").default("Unknown").notNull(),
      status: mediaLeadStatusEnum("status").default("Lead").notNull(),
      caseRef: varchar("caseRef", { length: 128 }),
      notes: text("notes"),
      savedBy: varchar("savedBy", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    depedSchools = pgTable("deped_schools", {
      id: serial("id").primaryKey(),
      schoolId: varchar("schoolId", { length: 64 }),
      schoolName: varchar("schoolName", { length: 255 }).notNull(),
      region: varchar("region", { length: 128 }),
      province: varchar("province", { length: 128 }),
      municipality: varchar("municipality", { length: 128 }),
      programs: text("programs"),
      tvlSpecializations: text("tvlSpecializations"),
      importedAt: timestamp("importedAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      resendApiKey: process.env.RESEND_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addBookmark: () => addBookmark,
  bulkInsertDepedSchools: () => bulkInsertDepedSchools,
  createApplication: () => createApplication,
  createDonorContact: () => createDonorContact,
  createExportLog: () => createExportLog,
  createInvitation: () => createInvitation,
  createMediaLead: () => createMediaLead,
  createProject: () => createProject,
  createSchoolContact: () => createSchoolContact,
  createTip: () => createTip,
  createVloggerInquiry: () => createVloggerInquiry,
  createVolunteerApplication: () => createVolunteerApplication,
  deleteApplication: () => deleteApplication,
  deleteDonorContact: () => deleteDonorContact,
  deleteProject: () => deleteProject,
  deleteScanLead: () => deleteScanLead,
  deleteTip: () => deleteTip,
  deleteVloggerInquiry: () => deleteVloggerInquiry,
  getActivityStats: () => getActivityStats,
  getAllApplications: () => getAllApplications,
  getAllExportLogs: () => getAllExportLogs,
  getAllScanLeads: () => getAllScanLeads,
  getAllTips: () => getAllTips,
  getAllUsers: () => getAllUsers,
  getAllVloggerInquiries: () => getAllVloggerInquiries,
  getAllVolunteerApplications: () => getAllVolunteerApplications,
  getApplicationById: () => getApplicationById,
  getBookmarks: () => getBookmarks,
  getDb: () => getDb,
  getDepedProvinces: () => getDepedProvinces,
  getDepedRegions: () => getDepedRegions,
  getDepedSchoolCount: () => getDepedSchoolCount,
  getDonorContactById: () => getDonorContactById,
  getDonorContacts: () => getDonorContacts,
  getMediaLeads: () => getMediaLeads,
  getMediaOutreachStatuses: () => getMediaOutreachStatuses,
  getNoteForCase: () => getNoteForCase,
  getProjects: () => getProjects,
  getPublicStats: () => getPublicStats,
  getRecentlyViewed: () => getRecentlyViewed,
  getSchoolContacts: () => getSchoolContacts,
  getTipById: () => getTipById,
  getUserByOpenId: () => getUserByOpenId,
  getVloggerInquiryById: () => getVloggerInquiryById,
  getVolunteerApplicationById: () => getVolunteerApplicationById,
  getVolunteerByDocId: () => getVolunteerByDocId,
  recordRecentlyViewed: () => recordRecentlyViewed,
  removeBookmark: () => removeBookmark,
  saveScanLead: () => saveScanLead,
  searchDepedSchools: () => searchDepedSchools,
  setUserRole: () => setUserRole,
  updateApplication: () => updateApplication,
  updateApplicationEmailTracking: () => updateApplicationEmailTracking,
  updateDonorContact: () => updateDonorContact,
  updateMediaLead: () => updateMediaLead,
  updateProjectCases: () => updateProjectCases,
  updateScanLeadStatus: () => updateScanLeadStatus,
  updateSchoolContact: () => updateSchoolContact,
  updateTip: () => updateTip,
  updateVloggerInquiry: () => updateVloggerInquiry,
  updateVolunteerApplication: () => updateVolunteerApplication,
  upsertMediaOutreachStatus: () => upsertMediaOutreachStatus,
  upsertNote: () => upsertNote,
  upsertUser: () => upsertUser
});
import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: "require" });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    const value = user[field];
    if (value === void 0) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function setUserRole(openId, role) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.openId, openId));
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}
async function createApplication(data) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.insert(vettingApplications).values(data);
}
async function getAllApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vettingApplications).orderBy(desc(vettingApplications.createdAt));
}
async function getApplicationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vettingApplications).where(eq(vettingApplications.id, id)).limit(1);
  return result[0] ?? null;
}
async function updateApplication(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(vettingApplications).set(data).where(eq(vettingApplications.id, id));
}
async function deleteApplication(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vettingApplications).where(eq(vettingApplications.id, id));
}
async function updateApplicationEmailTracking(id, emailId, emailType) {
  const db = await getDb();
  if (!db) return;
  await db.update(vettingApplications).set({
    lastEmailId: emailId,
    lastEmailType: emailType,
    lastEmailSentAt: /* @__PURE__ */ new Date()
  }).where(eq(vettingApplications.id, id));
}
async function getPublicStats() {
  const db = await getDb();
  if (!db) return { total: 0, approved: 0, pending: 0, approvedResearchers: 0, tipsReceived: 0, countriesRepresented: 0 };
  const [totalResult, approvedResult, pendingResult, tipsResult] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(vettingApplications),
    db.select({ count: sql`count(*)` }).from(vettingApplications).where(eq(vettingApplications.status, "approved")),
    db.select({ count: sql`count(*)` }).from(vettingApplications).where(eq(vettingApplications.status, "pending")),
    db.select({ count: sql`count(*)` }).from(tips)
  ]);
  const approvedCount = Number(approvedResult[0]?.count ?? 0);
  return {
    total: Number(totalResult[0]?.count ?? 0),
    approved: approvedCount,
    pending: Number(pendingResult[0]?.count ?? 0),
    approvedResearchers: approvedCount,
    tipsReceived: Number(tipsResult[0]?.count ?? 0),
    countriesRepresented: 0
  };
}
async function getActivityStats() {
  const db = await getDb();
  if (!db) return { recentApplications: [], recentTips: [], activeThisWeek: 0, activeThisMonth: 0, neverLoggedIn: 0, inactiveOver14Days: 0, applicantsWithLogin: [] };
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 864e5);
  const fourteenDaysAgo = new Date(now - 14 * 864e5);
  const thirtyDaysAgo = new Date(now - 30 * 864e5);
  const [recentApplications, recentTips, allApproved] = await Promise.all([
    db.select().from(vettingApplications).orderBy(desc(vettingApplications.createdAt)).limit(10),
    db.select().from(tips).orderBy(desc(tips.createdAt)).limit(10),
    db.select().from(vettingApplications).where(eq(vettingApplications.status, "approved"))
  ]);
  const applicantsWithLogin = allApproved.map((a) => ({
    id: a.id,
    hasAccount: true,
    lastSignedIn: a.updatedAt ?? null
  }));
  const activeThisWeek = applicantsWithLogin.filter((a) => a.lastSignedIn && new Date(a.lastSignedIn) >= sevenDaysAgo).length;
  const activeThisMonth = applicantsWithLogin.filter((a) => a.lastSignedIn && new Date(a.lastSignedIn) >= thirtyDaysAgo).length;
  const neverLoggedIn = applicantsWithLogin.filter((a) => !a.hasAccount).length;
  const inactiveOver14Days = applicantsWithLogin.filter((a) => a.lastSignedIn && new Date(a.lastSignedIn) < fourteenDaysAgo).length;
  return { recentApplications, recentTips, activeThisWeek, activeThisMonth, neverLoggedIn, inactiveOver14Days, applicantsWithLogin };
}
async function createInvitation(email, token, personalMessage, sentBy) {
  const db = await getDb();
  if (!db) return;
  await db.insert(invitations).values({ email, token, personalMessage, sentBy });
}
async function createTip(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tips).values(data);
}
async function getAllTips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tips).orderBy(desc(tips.createdAt));
}
async function getTipById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tips).where(eq(tips.id, id)).limit(1);
  return result[0] ?? null;
}
async function updateTip(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(tips).set(data).where(eq(tips.id, id));
}
async function deleteTip(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tips).where(eq(tips.id, id));
}
async function createExportLog(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(exportLogs).values(data);
}
async function getAllExportLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exportLogs).orderBy(desc(exportLogs.exportedAt));
}
async function createVolunteerApplication(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(volunteerApplications).values(data);
}
async function getAllVolunteerApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(volunteerApplications).orderBy(desc(volunteerApplications.createdAt));
}
async function getVolunteerApplicationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(volunteerApplications).where(eq(volunteerApplications.id, id)).limit(1);
  return result[0] ?? null;
}
async function updateVolunteerApplication(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(volunteerApplications).set(data).where(eq(volunteerApplications.id, id));
}
async function getVolunteerByDocId(docId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(volunteerApplications).where(eq(volunteerApplications.certificateDocId, docId)).limit(1);
  return result[0] ?? null;
}
async function getSchoolContacts(status) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(schoolContacts).where(eq(schoolContacts.status, status)).orderBy(desc(schoolContacts.createdAt));
  }
  return db.select().from(schoolContacts).orderBy(desc(schoolContacts.createdAt));
}
async function createSchoolContact(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(schoolContacts).values(data);
}
async function updateSchoolContact(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(schoolContacts).set(data).where(eq(schoolContacts.id, id));
}
async function getMediaOutreachStatuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaOutreachStatus).orderBy(mediaOutreachStatus.contactNum);
}
async function upsertMediaOutreachStatus(contactNum, status, lastContactedAt, responseNotes) {
  const db = await getDb();
  if (!db) return;
  const updateData = { status };
  if (lastContactedAt) updateData.lastContactedAt = lastContactedAt;
  if (responseNotes !== void 0) updateData.responseNotes = responseNotes;
  await db.insert(mediaOutreachStatus).values({ contactNum, status, lastContactedAt: lastContactedAt ?? null, responseNotes: responseNotes ?? null }).onConflictDoUpdate({ target: mediaOutreachStatus.contactNum, set: updateData });
}
async function getDonorContacts(status) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(donorContacts).where(eq(donorContacts.status, status)).orderBy(desc(donorContacts.createdAt));
  }
  return db.select().from(donorContacts).orderBy(desc(donorContacts.createdAt));
}
async function getDonorContactById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(donorContacts).where(eq(donorContacts.id, id)).limit(1);
  return result[0] ?? null;
}
async function createDonorContact(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(donorContacts).values(data);
}
async function updateDonorContact(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(donorContacts).set(data).where(eq(donorContacts.id, id));
}
async function deleteDonorContact(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(donorContacts).where(eq(donorContacts.id, id));
}
async function getAllVloggerInquiries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vloggerInquiries).orderBy(desc(vloggerInquiries.createdAt));
}
async function getVloggerInquiryById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vloggerInquiries).where(eq(vloggerInquiries.id, id)).limit(1);
  return result[0] ?? null;
}
async function createVloggerInquiry(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(vloggerInquiries).values(data);
}
async function updateVloggerInquiry(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(vloggerInquiries).set(data).where(eq(vloggerInquiries.id, id));
}
async function deleteVloggerInquiry(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vloggerInquiries).where(eq(vloggerInquiries.id, id));
}
async function getBookmarks(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researcherBookmarks).where(eq(researcherBookmarks.researcherId, userId)).orderBy(desc(researcherBookmarks.createdAt));
}
async function addBookmark(userId, caseId, caseTitle) {
  const db = await getDb();
  if (!db) return;
  await db.insert(researcherBookmarks).values({ researcherId: userId, caseId, caseTitle: caseTitle ?? null }).onConflictDoNothing();
}
async function removeBookmark(userId, caseId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researcherBookmarks).where(and(eq(researcherBookmarks.researcherId, userId), eq(researcherBookmarks.caseId, caseId)));
}
async function getNoteForCase(userId, caseId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(researcherNotes).where(and(eq(researcherNotes.researcherId, userId), eq(researcherNotes.caseId, caseId))).limit(1);
  return result[0] ?? null;
}
async function upsertNote(userId, caseId, note) {
  const db = await getDb();
  if (!db) return;
  const existing = await getNoteForCase(userId, caseId);
  if (existing) {
    await db.update(researcherNotes).set({ note, updatedAt: /* @__PURE__ */ new Date() }).where(eq(researcherNotes.id, existing.id));
  } else {
    await db.insert(researcherNotes).values({ researcherId: userId, caseId, note });
  }
}
async function getProjects(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researcherProjects).where(eq(researcherProjects.researcherId, userId)).orderBy(desc(researcherProjects.updatedAt));
}
async function createProject(userId, title, description) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(researcherProjects).values({ researcherId: userId, title, description: description ?? null }).returning({ id: researcherProjects.id });
  return result[0]?.id ?? null;
}
async function updateProjectCases(projectId, userId, caseIds) {
  const db = await getDb();
  if (!db) return;
  await db.update(researcherProjects).set({ caseIds }).where(and(eq(researcherProjects.id, projectId), eq(researcherProjects.researcherId, userId)));
}
async function deleteProject(projectId, userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researcherProjects).where(and(eq(researcherProjects.id, projectId), eq(researcherProjects.researcherId, userId)));
}
async function recordRecentlyViewed(userId, caseId, caseTitle) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researcherRecentlyViewed).where(and(eq(researcherRecentlyViewed.researcherId, userId), eq(researcherRecentlyViewed.caseId, caseId)));
  await db.insert(researcherRecentlyViewed).values({ researcherId: userId, caseId, caseTitle: caseTitle ?? null });
  const rows = await db.select({ id: researcherRecentlyViewed.id }).from(researcherRecentlyViewed).where(eq(researcherRecentlyViewed.researcherId, userId)).orderBy(desc(researcherRecentlyViewed.viewedAt)).limit(100);
  if (rows.length > 20) {
    const toDelete = rows.slice(20).map((r) => r.id);
    for (const id of toDelete) {
      await db.delete(researcherRecentlyViewed).where(eq(researcherRecentlyViewed.id, id));
    }
  }
}
async function getRecentlyViewed(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researcherRecentlyViewed).where(eq(researcherRecentlyViewed.researcherId, userId)).orderBy(desc(researcherRecentlyViewed.viewedAt)).limit(20);
}
async function getAllScanLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creatorScanLeads).orderBy(desc(creatorScanLeads.savedAt));
}
async function saveScanLead(data) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(creatorScanLeads).values(data);
  return result;
}
async function updateScanLeadStatus(id, leadStatus, notes) {
  const db = await getDb();
  if (!db) return;
  await db.update(creatorScanLeads).set({ leadStatus, ...notes !== void 0 ? { notes } : {} }).where(eq(creatorScanLeads.id, id));
}
async function deleteScanLead(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(creatorScanLeads).where(eq(creatorScanLeads.id, id));
}
async function getMediaLeads(status) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(mediaLeads).where(eq(mediaLeads.status, status)).orderBy(desc(mediaLeads.createdAt));
  }
  return db.select().from(mediaLeads).orderBy(desc(mediaLeads.createdAt));
}
async function createMediaLead(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(mediaLeads).values(data);
}
async function updateMediaLead(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(mediaLeads).set(data).where(eq(mediaLeads.id, id));
}
async function getDepedSchoolCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)` }).from(depedSchools);
  return Number(result[0]?.count ?? 0);
}
async function searchDepedSchools(query, region, province, page = 1, pageSize = 50) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };
  const conditions = [];
  if (query) conditions.push(like(depedSchools.schoolName, `%${query}%`));
  if (region) conditions.push(eq(depedSchools.region, region));
  if (province) conditions.push(eq(depedSchools.province, province));
  const where = conditions.length > 0 ? and(...conditions) : void 0;
  const [rows, countResult] = await Promise.all([
    db.select().from(depedSchools).where(where).limit(pageSize).offset((page - 1) * pageSize).orderBy(depedSchools.schoolName),
    db.select({ count: sql`count(*)` }).from(depedSchools).where(where)
  ]);
  return { rows, total: Number(countResult[0]?.count ?? 0) };
}
async function bulkInsertDepedSchools(rows) {
  const db = await getDb();
  if (!db || rows.length === 0) return 0;
  await db.delete(depedSchools);
  const chunks = [];
  for (let i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i + 200));
  for (const chunk of chunks) await db.insert(depedSchools).values(chunk);
  return rows.length;
}
async function getDepedRegions() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.selectDistinct({ region: depedSchools.region }).from(depedSchools).orderBy(depedSchools.region);
  return result.map((r) => r.region).filter(Boolean);
}
async function getDepedProvinces(region) {
  const db = await getDb();
  if (!db) return [];
  const conditions = region ? [eq(depedSchools.region, region)] : [];
  const result = await db.selectDistinct({ province: depedSchools.province }).from(depedSchools).where(conditions.length ? and(...conditions) : void 0).orderBy(depedSchools.province);
  return result.map((r) => r.province).filter(Boolean);
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  invokeLLM: () => invokeLLM
});
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
    assertApiKey = () => {
      if (!ENV.forgeApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
    };
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  sendApprovalEmail: () => sendApprovalEmail,
  sendFinalNudgeFellowshipEmail: () => sendFinalNudgeFellowshipEmail,
  sendFollowUpFellowshipEmail: () => sendFollowUpFellowshipEmail,
  sendInvitationEmail: () => sendInvitationEmail,
  sendMoreInfoEmail: () => sendMoreInfoEmail,
  sendNewApplicationNotification: () => sendNewApplicationNotification,
  sendPressReleaseEmail: () => sendPressReleaseEmail,
  sendPrincipalFellowshipEmail: () => sendPrincipalFellowshipEmail,
  sendReengagementEmail: () => sendReengagementEmail,
  sendRejectionEmail: () => sendRejectionEmail,
  sendSubmissionConfirmation: () => sendSubmissionConfirmation,
  sendTeacherConfirmationEmail: () => sendTeacherConfirmationEmail,
  sendVloggerInquiryEmail: () => sendVloggerInquiryEmail,
  sendVolunteerApprovalEmail: () => sendVolunteerApprovalEmail,
  sendVolunteerConfirmationEmail: () => sendVolunteerConfirmationEmail,
  sendVolunteerRejectionEmail: () => sendVolunteerRejectionEmail
});
async function sendViaResend(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured \u2014 skipping send");
    return null;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return null;
    }
    const data = await res.json();
    return data.id ?? null;
  } catch (e) {
    console.error("[Email] Resend exception:", e?.message);
    return null;
  }
}
async function sendApprovalEmail(to, name, assignedRole) {
  return sendViaResend(
    to,
    "Your Application to The Vault Investigates \u2014 Approved \u2713",
    `<p>Dear ${name},</p>
    <p>Your application has been <strong>approved</strong>. You have been assigned the role of <strong>${assignedRole}</strong>.</p>
    <p>You can now access the platform at <a href="https://truthdrop.io">truthdrop.io</a>.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendRejectionEmail(to, name) {
  return sendViaResend(
    to,
    "Update on Your Application \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for your interest in The Vault Investigates. After careful review, we are unable to approve your application at this time.</p>
    <p>You are welcome to reapply in the future with a more detailed application.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendMoreInfoEmail(to, name, infoMessage) {
  return sendViaResend(
    to,
    "Action Required: Additional Information Needed \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Our review team requires additional information before we can make a final decision on your application.</p>
    <p><strong>Information Needed:</strong></p>
    <p>${infoMessage}</p>
    <p>Please reply to this email with the requested information, or resubmit at <a href="https://vet.thevault.watch">vet.thevault.watch</a>.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendNewApplicationNotification(params) {
  await sendViaResend(
    params.adminEmail,
    "New Vetting Application Received",
    `<h2>New Vetting Application</h2>
    <p>A new application has been submitted and requires your review.</p>
    <p><strong>Applicant:</strong> ${params.applicantName} (${params.applicantEmail})</p>
    <p><a href="https://vet.thevaultinvestigates.cloud/admin">Review Application \u2192</a></p>`
  );
}
async function sendSubmissionConfirmation(to, name) {
  await sendViaResend(
    to,
    "Application Received \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for applying to access The Vault Investigates database. Your application has been received and is under review.</p>
    <p>You will hear from us within 3\u20135 business days.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendReengagementEmail(to, name, _role) {
  return sendViaResend(
    to,
    "We miss you \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>We noticed you haven't logged in recently. The Vault Investigates database has new case files and updates waiting for you.</p>
    <p><a href="https://vet.thevaultinvestigates.cloud">Return to The Vault \u2192</a></p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendInvitationEmail(to, personalMessage, inviteUrl) {
  await sendViaResend(
    to,
    "You've been invited to The Vault Investigates",
    `<p>You have been personally invited to apply for access to The Vault Investigates database.</p>
    ${personalMessage ? `<p><em>${personalMessage}</em></p>` : ""}
    <p><a href="${inviteUrl}">Click here to apply \u2192</a></p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendTeacherConfirmationEmail(teacherEmail, teacherName, studentName, schoolName, role, _city) {
  await sendViaResend(
    teacherEmail,
    `Student Volunteer Application \u2014 ${studentName}`,
    `<p>Dear ${teacherName},</p>
    <p>Your student <strong>${studentName}</strong> has applied to volunteer with The Vault Investigates as a <strong>${role}</strong> from ${schoolName}.</p>
    <p>We will contact you if we need to verify their application.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendVolunteerConfirmationEmail(to, name, role, _schoolName, _teacherName, _parentalConsent) {
  await sendViaResend(
    to,
    "Volunteer Application Received \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for applying to volunteer as a <strong>${role}</strong> with The Vault Investigates. Your application is under review.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendVolunteerApprovalEmail(to, name, role) {
  await sendViaResend(
    to,
    "Volunteer Application Approved \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Congratulations! Your volunteer application has been approved. You are now an official <strong>${role}</strong> with The Vault Investigates.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
async function sendVolunteerRejectionEmail(to, name) {
  await sendViaResend(
    to,
    "Update on Your Volunteer Application \u2014 The Vault Investigates",
    `<p>Dear ${name},</p>
    <p>Thank you for your interest in volunteering with The Vault Investigates. After careful review, we are unable to approve your application at this time.</p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
}
function wrapOutreachEmail(contentHtml, titleText, subtitleText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleText}</title>
</head>
<body style="background-color: #050505; color: #e5e5e5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #000000; border: 1px solid #1a1a1a; border-radius: 8px; padding: 30px; border-collapse: collapse;">
    <tr>
      <td>
        <!-- Header -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td>
              <span style="font-family: monospace; font-size: 11px; color: #ff5722; text-transform: uppercase; letter-spacing: 1.5px;">${subtitleText}</span>
              <h1 style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${titleText}</h1>
            </td>
          </tr>
        </table>

        <!-- Body Content -->
        ${contentHtml}

        <!-- Stripe Support Banner -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-top: 30px; border-top: 1px solid #2d2d2d; padding-top: 20px;">
          <tr>
            <td style="padding: 20px; background-color: #0d0d0d; border-radius: 6px; border: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0 0 10px 0; font-family: monospace; font-size: 11px; color: #ff5722; text-transform: uppercase; letter-spacing: 1px;">\u26A1 Reader-Supported Research</p>
              <p style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #a0a0a0; line-height: 1.5;">
                The Vault Investigates is an independent, reader-funded platform. We receive no institutional backing. If you value our public accountability research, consider supporting our server costs and public records requests with a small tip.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td align="center" style="background-color: #ff5722; border-radius: 4px;">
                    <a href="https://vet.thevaultinvestigates.cloud/support" target="_blank" style="display: inline-block; padding: 8px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 4px;">Support Our Work</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
async function sendPrincipalFellowshipEmail(to, principalName, schoolName, district, lang = "en") {
  const operatorName = process.env.OWNER_NAME || "Papi Rican Blue";
  const lastName = principalName.split(" ").pop() || principalName;
  let subject = "";
  let title = "";
  let subtitle = "THE VAULT // CIVIC JOURNALISM FELLOWSHIP";
  let content = "";
  if (lang === "tl") {
    subject = `Paanyaya para sa Civic Journalism Fellowship Program / ${schoolName}`;
    title = "Pinalalakas ang Boses ng mga Estudyante.";
    content = `
      <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Mahal na Principal ${lastName},</p>
      
      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Sana ay nasa mabuti kayong kalagayan. Ako si <strong>${operatorName}</strong>, program director ng <strong>The Vault Investigates</strong>. Sumusulat kami upang anyayahan ang mga piling mag-aaral ng Senior High School mula sa <strong>${schoolName}</strong> na mag-apply para sa aming nalalapit na <strong>Civic Journalism Fellowship Program</strong>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Ang programang ito ay nagbibigay sa mga mag-aaral ng ligtas at aktwal na pagsasanay sa digital research, pagpapatunay ng pampublikong dokumento, at media literacy. Sa ilalim ng mahigpit na pahintulot ng mga magulang at propesyonal na gabay, matututuhan ng mga mag-aaral kung paano magsuri ng pampublikong dokumento, tumukoy ng pagsasamantala sa media, at sumuporta sa makatotohanang pagbabalita.
      </p>

      <div style="background-color: #0d0d0d; border-left: 3px solid #ff5722; padding: 15px; border-radius: 0 4px 4px 0; margin: 15px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #ffffff;">Mga Tampok ng Programa:</h3>
        <ul style="margin: 0; padding-left: 15px; font-size: 12px; color: #a0a0a0; line-height: 1.6;">
          <li>100% remote, flexible na mga gawain sa pananaliksik (tinatayang 3-5 oras kada linggo).</li>
          <li>Komprehensibong pagsasanay sa Open Source Intelligence (OSINT).</li>
          <li>Opisyal na <strong>Certificate of Accomplishment</strong> pagkatapos ng programa.</li>
        </ul>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Maaaring suriin ng mga interesadong mag-aaral ang kurikulum at isumite ang kanilang aplikasyon nang direkta sa aming portal: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Maraming salamat sa inyong pamumuno at dedikasyon sa edukasyong sibil. Huwag mag-atubiling makipag-ugnayan kung nais ninyong mag-iskedyul ng mabilis na tawag upang talakayin ang mga detalye ng programa.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Warm regards,<br>
        <strong>${operatorName}</strong><br>
        <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
      </p>
    `;
  } else {
    subject = `Invitation to join the Civic Journalism Fellowship Program / ${schoolName}`;
    title = "Empowering Student Voices.";
    content = `
      <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Dear Principal ${lastName},</p>
      
      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        I hope this email finds you well. My name is <strong>${operatorName}</strong>, program director at <strong>The Vault Investigates</strong>. We are writing to invite select Senior High School students from <strong>${schoolName}</strong> to apply for our upcoming <strong>Civic Journalism Fellowship Program</strong>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        This fellowship provides students with hands-on, secure training in digital research, public records verification, and media literacy. Under strict parental consent and professional guidance, student volunteers will learn how to analyze public documents, identify media exploitation, and support factual reporting.
      </p>

      <div style="background-color: #0d0d0d; border-left: 3px solid #ff5722; padding: 15px; border-radius: 0 4px 4px 0; margin: 15px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #ffffff;">Fellowship Highlights:</h3>
        <ul style="margin: 0; padding-left: 15px; font-size: 12px; color: #a0a0a0; line-height: 1.6;">
          <li>100% remote, flexible research tasks (approx. 3-5 hours/week).</li>
          <li>Comprehensive training in Open Source Intelligence (OSINT).</li>
          <li>Official <strong>Certificate of Accomplishment</strong> upon program completion.</li>
        </ul>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
        Interested students can review the full curriculum and submit their applications directly at our public portal: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Thank you for your leadership and dedication to civic education. Please feel free to reach out if you would like to schedule a brief call to discuss the program details.
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
        Warm regards,<br>
        <strong>${operatorName}</strong><br>
        <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
      </p>
    `;
  }
  const html = wrapOutreachEmail(content, title, subtitle);
  const emailId = await sendViaResend(to, subject, html);
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}
async function sendFollowUpFellowshipEmail(to, principalName, schoolName, _district) {
  const operatorName = process.env.OWNER_NAME || "Papi Rican Blue";
  const lastName = principalName.split(" ").pop() || principalName;
  const subject = `Follow-Up: Fellowship Opportunity \u2014 The Vault Investigates`;
  const title = "Continuing the Conversation.";
  const subtitle = "THE VAULT // CIVIC JOURNALISM FELLOWSHIP";
  const content = `
    <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Dear Principal ${lastName},</p>
    
    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      We are following up on our previous message regarding the remote, educational <strong>Civic Journalism Fellowship Program</strong> for students at <strong>${schoolName}</strong>.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      We understand that school administrations manage extremely demanding schedules. However, we wanted to ensure our invitation was received, as we are allocating a limited number of fellowship slots for select schools in your division.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      This program requires no school resources or funding, is fully remote/asynchronous, and is designed to build critical media verification skills. Interested students can apply at: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
      If you have any questions or would like to schedule a quick 5-minute introductory call, please feel free to reply directly to this email.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
      Warm regards,<br>
      <strong>${operatorName}</strong><br>
      <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
    </p>
  `;
  const html = wrapOutreachEmail(content, title, subtitle);
  const emailId = await sendViaResend(to, subject, html);
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}
async function sendFinalNudgeFellowshipEmail(to, principalName, schoolName, _district) {
  const operatorName = process.env.OWNER_NAME || "Papi Rican Blue";
  const lastName = principalName.split(" ").pop() || principalName;
  const subject = `Final Notice: Fellowship Opportunity \u2014 The Vault Investigates`;
  const title = "Final Invitation.";
  const subtitle = "THE VAULT // CIVIC JOURNALISM FELLOWSHIP";
  const content = `
    <p style="font-size: 14px; line-height: 1.6; color: #e5e5e5;">Dear Principal ${lastName},</p>
    
    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      This is our final follow-up regarding the remote, educational <strong>Civic Journalism Fellowship Program</strong> for students at <strong>${schoolName}</strong>. We understand you are incredibly busy and we deeply respect your time.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      We will close applications for this cohort shortly. If any students from your school are interested in digital OSINT research and media verification, they are welcome to apply before the deadline at: <a href="https://vet.thevaultinvestigates.cloud/volunteer" target="_blank" style="color: #ff5722; text-decoration: underline;">vet.thevaultinvestigates.cloud/volunteer</a>.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc;">
      If we do not hear from you, we will not contact you again regarding this cohort. Thank you for your dedication to your students and your leadership in civic education.
    </p>

    <p style="font-size: 13px; line-height: 1.6; color: #cccccc; margin-top: 20px;">
      Warm regards,<br>
      <strong>${operatorName}</strong><br>
      <span style="font-size: 11px; color: #888888; font-family: monospace;">The Vault Investigates Team</span>
    </p>
  `;
  const html = wrapOutreachEmail(content, title, subtitle);
  const emailId = await sendViaResend(to, subject, html);
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}
async function sendPressReleaseEmail(to, contactName, orgName, subject, personalNote) {
  const emailId = await sendViaResend(
    to,
    subject || `Press Inquiry \u2014 The Vault Investigates`,
    `<p>Dear ${contactName} / ${orgName},</p>
    <p>${personalNote}</p>
    <p>\u2014 The Vault Investigates Team<br><a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a></p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}
async function sendVloggerInquiryEmail(params) {
  const { recipientEmail, creatorName, letterText, deadline } = params;
  const emailId = await sendViaResend(
    recipientEmail,
    `Press Inquiry \u2014 The Vault Investigates`,
    `<p>Dear ${creatorName},</p>
    ${letterText}
    <p><em>Response deadline: ${deadline}</em></p>
    <p>\u2014 The Vault Investigates Team</p>`
  );
  if (emailId) return { success: true, emailId };
  return { success: false, error: "Failed to send via Resend" };
}
var RESEND_API_KEY, FROM_EMAIL, FROM_NAME;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    RESEND_API_KEY = process.env.RESEND_API_KEY;
    FROM_EMAIL = "editor@vet.thevaultinvestigates.cloud";
    FROM_NAME = "The Vault Investigates";
  }
});

// server/depedSchoolDirectory.ts
var depedSchoolDirectory_exports = {};
__export(depedSchoolDirectory_exports, {
  DEPED_SCHOOLS: () => DEPED_SCHOOLS,
  searchSchools: () => searchSchools
});
function searchSchools(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = DEPED_SCHOOLS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.principal.toLowerCase().includes(q) || s.district.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
  );
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return aExact - bExact;
  });
  return results.slice(0, 10);
}
var DEPED_SCHOOLS;
var init_depedSchoolDirectory = __esm({
  "server/depedSchoolDirectory.ts"() {
    "use strict";
    DEPED_SCHOOLS = [
      // ── MANILA CITY ──────────────────────────────────────────────────────────
      {
        id: "manila-001",
        name: "Pres. Sergio Osme\xF1a High School",
        principal: "Mrs. Mayet R. Dela Cruz",
        principalTitle: "Principal",
        district: "Tondo District",
        city: "Manila",
        address: "560 Pampanga St., Tondo, Manila",
        phone: "0949-324-8147",
        email: "osmena.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-002",
        name: "Timoteo Paez Integrated School",
        principal: "Sonny D. Valenzuela",
        principalTitle: "Principal",
        district: "Tondo District",
        city: "Manila",
        address: "Younger St., Balut, Tondo, Manila",
        phone: "(02) 8638-1764",
        email: "timoteopaez.manila@deped.gov.ph"
      },
      {
        id: "manila-003",
        name: "Tondo High School",
        principal: "Mrs. Anita R. De Guzman",
        principalTitle: "Assistant School Principal",
        district: "Tondo District",
        city: "Manila",
        address: "Quezon St., Bo. Magsaysay, Tondo, Manila",
        phone: "0956-128-6049",
        email: "tondo.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-004",
        name: "Do\xF1a Teodora Alonzo High School",
        principal: "Carmelita T. Tabio",
        principalTitle: "Assistant School Principal",
        district: "Sta. Cruz District",
        city: "Manila",
        address: "Alvarez St., Sta. Cruz, Manila",
        phone: "0995-700-0039",
        email: "dtalonzo.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-005",
        name: "Jose Abad Santos High School",
        principal: "Elena C. Reyes",
        principalTitle: "Principal",
        district: "Binondo District",
        city: "Manila",
        address: "Numancia St., Binondo, Manila",
        phone: "(02) 8245-7772",
        email: "jashs.manila@deped.gov.ph"
      },
      {
        id: "manila-006",
        name: "Raja Soliman Science and Technology High School",
        principal: "Dr. Ligaya G. Quides",
        principalTitle: "Principal",
        district: "Binondo District",
        city: "Manila",
        address: "Urbiztondo St., San Nicolas Dist., Binondo, Manila",
        phone: "(02) 8243-2505",
        email: "rajasoliman.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-007",
        name: "Ignacio Villamor Senior High School II",
        principal: "Jonathan P. Nacua",
        principalTitle: "Principal",
        district: "San Andres District",
        city: "Manila",
        address: "2118 San Andres Ext., San Andres Bukid, Manila",
        phone: "(02) 8703-0311",
        email: "villamor.shs.manila@deped.gov.ph"
      },
      {
        id: "manila-008",
        name: "Mariano Marcos Memorial High School",
        principal: "Ms. Consolacion K. Naanep",
        principalTitle: "Principal IV",
        district: "Sta. Ana District",
        city: "Manila",
        address: "2090 Dr. M.L. Carreon St., Sta. Ana, Manila",
        phone: "(02) 8426-5648",
        email: "marianomarcos.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-009",
        name: "Manuel A. Roxas Senior High School",
        principal: "Mr. Cipriano T. Lauigan",
        principalTitle: "Principal",
        district: "Paco District",
        city: "Manila",
        address: "Pres. Quirino Ave. Ext., Corner Osme\xF1a High Way, Paco, Manila",
        phone: "(02) 8562-2414",
        email: "manuelroxas.shs.manila@deped.gov.ph"
      },
      {
        id: "manila-010",
        name: "E. Rodriguez Vocational High School",
        principal: "Mrs. Divina T. Maninang",
        principalTitle: "Principal IV",
        district: "Sampaloc District",
        city: "Manila",
        address: "Nagtahan, Sampaloc, Manila",
        phone: "(02) 8714-0753",
        email: "erodriguez.vhs.manila@deped.gov.ph"
      },
      {
        id: "manila-011",
        name: "Carlos P. Garcia High School",
        principal: "Elvira C. Cabaluna",
        principalTitle: "Assistant Principal",
        district: "Pandacan District",
        city: "Manila",
        address: "Jesus St., Pandacan, Manila",
        phone: "0945-516-8261",
        email: "cpgarcia.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-012",
        name: "Claro M. Recto High School",
        principal: "Mrs. Eufroia T. Francisco",
        principalTitle: "Assistant Principal",
        district: "Sampaloc District",
        city: "Manila",
        address: "320 M.F. Jhocson St., Sampaloc, Manila",
        phone: "0956-401-9511",
        email: "cmrtecto.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-013",
        name: "Ramon Avance\xF1a High School",
        principal: "Mr. Danilo B. Estavillo",
        principalTitle: "Principal",
        district: "Quiapo District",
        city: "Manila",
        address: "J. Nepomuceno St., Quiapo, Manila",
        phone: "0927-185-1448",
        email: "avancena.hs.manila@deped.gov.ph"
      },
      {
        id: "manila-014",
        name: "Antonio A. Maceda Integrated School \u2013 High School",
        principal: "Mr. Julius J. Jardiolin",
        principalTitle: "Principal",
        district: "Sta. Mesa District",
        city: "Manila",
        address: "Buenos Aires St., Sta. Mesa, Manila",
        phone: "(02) 715-6883",
        email: "maceda.is.manila@deped.gov.ph"
      },
      {
        id: "manila-015",
        name: "Manila Science High School",
        principal: "Mr. Mark Gil Tabor",
        principalTitle: "Principal",
        district: "Ermita District",
        city: "Manila",
        address: "Taft Ave., Ermita, Manila",
        phone: "(02) 8523-7241",
        email: "manilasciencehs.admission@gmail.com"
      },
      // ── PARAÑAQUE CITY ───────────────────────────────────────────────────────
      {
        id: "paranaque-001",
        name: "Para\xF1aque National High School \u2013 Main",
        principal: "Mr. Gerry A. Lumaban",
        principalTitle: "Principal IV",
        district: "Para\xF1aque City",
        city: "Para\xF1aque",
        address: "Kay Talise St., Dr. A. Santos Ave., San Dionisio, Para\xF1aque City",
        phone: "(02) 7729-2132",
        email: "pnhs.pque@deped.gov.ph"
      },
      {
        id: "paranaque-002",
        name: "Para\xF1aque National High School \u2013 Baclaran",
        principal: "Gerry C. Catchillar",
        principalTitle: "Principal IV",
        district: "Para\xF1aque City",
        city: "Para\xF1aque",
        address: "Rimas St., Dimasalang Ext., Para\xF1aque City",
        phone: "(02) 8568-5376",
        email: "pnhs.baclaran.pque@deped.gov.ph"
      },
      {
        id: "paranaque-003",
        name: "Moonwalk National High School",
        principal: "Leonisa D. Romano, PhD",
        principalTitle: "Principal II",
        district: "Para\xF1aque City",
        city: "Para\xF1aque",
        address: "St. Mary's Daang Batang St., Brgy. Moonwalk, Para\xF1aque City",
        phone: "0995-953-4426",
        email: "moonwalk.nhs.pque@deped.gov.ph"
      },
      {
        id: "paranaque-004",
        name: "Dr. Arcadio Santos National High School",
        principal: "Marilou A. De Jesus",
        principalTitle: "Principal IV",
        district: "Para\xF1aque City",
        city: "Para\xF1aque",
        address: "Km. East Service Road, Brgy. San Martin de Porres, Para\xF1aque City",
        phone: "(02) 8835-7688",
        email: "arcadiosantos.nhs.pque@deped.gov.ph"
      },
      {
        id: "paranaque-005",
        name: "Masville National High School",
        principal: "Gina N. Zapico",
        principalTitle: "Principal II",
        district: "Para\xF1aque City",
        city: "Para\xF1aque",
        address: "Silangan, Masville Sucat, Brgy. B.F. Homes, Para\xF1aque City",
        phone: "(02) 8541-3952",
        email: "masville.nhs.pque@deped.gov.ph"
      },
      // ── PASAY CITY ───────────────────────────────────────────────────────────
      {
        id: "pasay-001",
        name: "Kalayaan National High School",
        principal: "Dr. Cynthia Abella",
        principalTitle: "Assistant Principal",
        district: "Pasay City",
        city: "Pasay",
        address: "Bliss Road, Kalayaan Village, Brgy. 201, Pasay City",
        phone: "(02) 8824-1990",
        email: "kalayaan.nhs.pasay@deped.gov.ph"
      },
      {
        id: "pasay-002",
        name: "Pasay City South High School",
        principal: "Emilia L. Tolentino",
        principalTitle: "Principal IV",
        district: "Pasay City",
        city: "Pasay",
        address: "Piccio Garden, Villamor Air Base, Pasay City",
        phone: "(02) 8533-0886",
        email: "pasaycitysouth.hs@deped.gov.ph"
      },
      {
        id: "pasay-003",
        name: "Pasay City North High School \u2013 Tramo Campus",
        principal: "Sonny J. Adriano",
        principalTitle: "Principal",
        district: "Pasay City",
        city: "Pasay",
        address: "Tramo Street, Pasay City",
        phone: "(02) 8519-9699",
        email: "pasaycitynorth.hs@deped.gov.ph"
      },
      {
        id: "pasay-004",
        name: "Pasay City West High School",
        principal: "Mr. Peter R. Cannon Jr.",
        principalTitle: "Principal IV",
        district: "Pasay City",
        city: "Pasay",
        address: "Pasade\xF1a St. Corner F.B. Harrison, Pasay City",
        phone: "(02) 8831-9916",
        email: "pasaycitywest.hs@deped.gov.ph"
      },
      {
        id: "pasay-005",
        name: "Pasay City East High School",
        principal: "Dr. Felina P. Patagan",
        principalTitle: "Principal I",
        district: "Pasay City",
        city: "Pasay",
        address: "E. Rodriguez St., Malibay, Pasay City",
        phone: "(02) 8854-2981",
        email: "pasaycityeast.hs@deped.gov.ph"
      },
      {
        id: "pasay-006",
        name: "President Corazon C. Aquino National High School",
        principal: "Nunilon L. Moreno, Ph.D.",
        principalTitle: "School Principal",
        district: "Pasay City",
        city: "Pasay",
        address: "Yellowbell St., Maricaban 1300, Pasay City",
        phone: "0927-384-8587",
        email: "coryaquino.nhs.pasay@deped.gov.ph"
      },
      // ── QUEZON CITY ──────────────────────────────────────────────────────────
      {
        id: "qc-001",
        name: "Quezon City Science High School",
        principal: "Dr. Maricel M. Paguia",
        principalTitle: "Principal IV",
        district: "Quezon City District 1",
        city: "Quezon City",
        address: "Misamis St., Bago Bantay, Quezon City",
        phone: "(02) 8371-9531",
        email: "qcshs.qc@deped.gov.ph"
      },
      {
        id: "qc-002",
        name: "Batasan Hills National High School",
        principal: "Mr. Rodolfo M. Villanueva",
        principalTitle: "Principal IV",
        district: "Quezon City District 6",
        city: "Quezon City",
        address: "Batasan Hills, Quezon City",
        phone: "(02) 8931-0025",
        email: "batasnhills.nhs.qc@deped.gov.ph"
      },
      {
        id: "qc-003",
        name: "Commonwealth High School",
        principal: "Mrs. Lolita P. Reyes",
        principalTitle: "Principal III",
        district: "Quezon City District 6",
        city: "Quezon City",
        address: "Commonwealth Ave., Quezon City",
        phone: "(02) 8936-2178",
        email: "commonwealth.hs.qc@deped.gov.ph"
      },
      {
        id: "qc-004",
        name: "Novaliches High School",
        principal: "Dr. Rosario T. Bautista",
        principalTitle: "Principal IV",
        district: "Quezon City District 5",
        city: "Quezon City",
        address: "Novaliches, Quezon City",
        phone: "(02) 8936-6185",
        email: "novaliches.hs.qc@deped.gov.ph"
      },
      {
        id: "qc-005",
        name: "Talipapa National High School",
        principal: "Mrs. Cynthia A. Santos",
        principalTitle: "Principal II",
        district: "Quezon City District 5",
        city: "Quezon City",
        address: "Talipapa, Novaliches, Quezon City",
        phone: "0917-823-4561",
        email: "talipapa.nhs.qc@deped.gov.ph"
      },
      // ── MAKATI CITY ──────────────────────────────────────────────────────────
      {
        id: "makati-001",
        name: "Makati Science High School",
        principal: "Dr. Leonora T. Dela Cruz",
        principalTitle: "Principal IV",
        district: "Makati City",
        city: "Makati",
        address: "Amorsolo St., Legaspi Village, Makati City",
        phone: "(02) 8817-3416",
        email: "makatisciencehs@deped.gov.ph"
      },
      {
        id: "makati-002",
        name: "Pembo National High School",
        principal: "Mrs. Felicidad R. Gonzales",
        principalTitle: "Principal III",
        district: "Makati City",
        city: "Makati",
        address: "Pembo, Makati City",
        phone: "(02) 8882-5624",
        email: "pembo.nhs.makati@deped.gov.ph"
      },
      {
        id: "makati-003",
        name: "Fort Bonifacio High School",
        principal: "Mr. Ernesto C. Villanueva",
        principalTitle: "Principal II",
        district: "Makati City",
        city: "Makati",
        address: "Fort Bonifacio, Makati City",
        phone: "(02) 8843-7219",
        email: "fortbonifacio.hs.makati@deped.gov.ph"
      },
      // ── CALOOCAN CITY ────────────────────────────────────────────────────────
      {
        id: "caloocan-001",
        name: "Caloocan City Science High School",
        principal: "Dr. Amelia B. Reyes",
        principalTitle: "Principal IV",
        district: "Caloocan City North",
        city: "Caloocan",
        address: "Camarin, Caloocan City",
        phone: "(02) 8961-4523",
        email: "caloocan.scihs@deped.gov.ph"
      },
      {
        id: "caloocan-002",
        name: "Bagong Silang National High School",
        principal: "Mrs. Rosalinda G. Torres",
        principalTitle: "Principal III",
        district: "Caloocan City North",
        city: "Caloocan",
        address: "Bagong Silang, Caloocan City",
        phone: "(02) 8961-7834",
        email: "bagongsilang.nhs.caloocan@deped.gov.ph"
      },
      {
        id: "caloocan-003",
        name: "Caloocan High School",
        principal: "Mr. Danilo S. Macaraeg",
        principalTitle: "Principal IV",
        district: "Caloocan City South",
        city: "Caloocan",
        address: "10th Ave., Caloocan City",
        phone: "(02) 8364-2891",
        email: "caloocan.hs@deped.gov.ph"
      },
      // ── MARIKINA CITY ────────────────────────────────────────────────────────
      {
        id: "marikina-001",
        name: "Marikina Science High School",
        principal: "Dr. Jocelyn P. Reyes",
        principalTitle: "Principal IV",
        district: "Marikina City",
        city: "Marikina",
        address: "Concepcion, Marikina City",
        phone: "(02) 8941-7623",
        email: "marikina.scihs@deped.gov.ph"
      },
      {
        id: "marikina-002",
        name: "Marikina High School",
        principal: "Mrs. Teresita A. Bernardo",
        principalTitle: "Principal III",
        district: "Marikina City",
        city: "Marikina",
        address: "Sto. Ni\xF1o, Marikina City",
        phone: "(02) 8941-2345",
        email: "marikina.hs@deped.gov.ph"
      },
      // ── SDO MANILA DIVISION OFFICE (umbrella contact) ────────────────────────
      {
        id: "sdo-manila",
        name: "Schools Division Office of Manila (SDO Manila)",
        principal: "Schools Division Superintendent",
        principalTitle: "Division Superintendent",
        district: "All Manila Districts",
        city: "Manila",
        address: "Manila Education Center, Arroceros Forest Park, Antonio J. Villegas St., Ermita, Manila",
        phone: "(02) 8527-5009",
        email: "sdo.manila@deped.gov.ph"
      }
    ];
  }
});

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/adminAuth.ts
init_db();
import { SignJWT as SignJWT2 } from "jose";
import crypto2 from "node:crypto";
init_env();
function hashPassword(password, salt) {
  return crypto2.scryptSync(password, salt, 64).toString("hex");
}
function verifyPassword(password, storedHash, salt) {
  const candidateHash = hashPassword(password, salt);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto2.timingSafeEqual(a, b);
}
function getSessionSecret() {
  const secret = ENV.cookieSecret;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}
async function signAdminSession(openId, name) {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1e3);
  const secretKey = getSessionSecret();
  return new SignJWT2({
    openId,
    appId: "vault-admin-local",
    name
  }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
}
function registerAdminAuthRoutes(app2) {
  app2.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { password } = req.body ?? {};
      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "Password is required" });
        return;
      }
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      const adminPasswordSalt = process.env.ADMIN_PASSWORD_SALT;
      if (!adminPasswordHash || !adminPasswordSalt) {
        console.error("[AdminAuth] ADMIN_PASSWORD_HASH / ADMIN_PASSWORD_SALT not configured");
        res.status(500).json({ error: "Admin login not configured" });
        return;
      }
      const isValid = verifyPassword(password, adminPasswordHash, adminPasswordSalt);
      if (!isValid) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const openId = "admin-local";
      const signedInAt = /* @__PURE__ */ new Date();
      await upsertUser({
        openId,
        name: "Vault Archivist",
        email: null,
        loginMethod: "local-password",
        lastSignedIn: signedInAt
      });
      await setUserRole(openId, "admin");
      const sessionToken = await signAdminSession(openId, "Vault Archivist");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[AdminAuth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/admin-logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { nanoid } from "nanoid";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    await Promise.all([
      sendDiscordAlert(title, content),
      sendTelegramAlert(title, content)
    ]).catch((err) => {
      console.warn("[Notification] Webhook dispatch error:", err);
    });
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
async function sendDiscordAlert(title, content) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return false;
  try {
    const payload = {
      username: "The Vault Command Center",
      avatar_url: "https://thevaultinvestigates.cloud/favicon.ico",
      embeds: [
        {
          title,
          description: content,
          color: 15158332,
          // Dark Red / Crimson
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          footer: {
            text: "The Vault Investigates \u2014 Alert System"
          }
        }
      ]
    };
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.warn(`[Discord Webhook] Failed to send: ${response.status} ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Discord Webhook] Error:", error);
    return false;
  }
}
async function sendTelegramAlert(title, content) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const text2 = `\u{1F6A8} *${title}*

${content}`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text2,
        parse_mode: "Markdown"
      })
    });
    if (!response.ok) {
      console.warn(`[Telegram Webhook] Failed to send: ${response.status} ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Telegram Webhook] Error:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();

// server/storage.ts
init_env();
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/pdfWatermark.ts
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
async function applyWatermark(pdfBytes, opts) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const pages = pdfDoc.getPages();
  const tsFormatted = opts.exportedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC").replace("Z", " UTC");
  const diagonalLines = [
    "FOR INVESTIGATIVE USE ONLY",
    "The Vault Investigates / TruthDrop.io",
    `Researcher: ${opts.researcherAlias}`,
    `Exported:   ${tsFormatted}`,
    // Split UUID into two groups of 18 chars so it fits when rotated
    `Doc ID: ${opts.documentId.substring(0, 18)}`,
    `        ${opts.documentId.substring(18)}`
  ];
  const footerLine1 = `The Vault Investigates  |  Researcher: ${opts.researcherAlias}  |  ${tsFormatted}`;
  const footerLine2 = `Document ID: ${opts.documentId}`;
  const footerTotalHeight = 34;
  for (const page of pages) {
    const { width, height } = page.getSize();
    const lineHeight = 18;
    const totalHeight = diagonalLines.length * lineHeight;
    const startY = height / 2 + totalHeight / 2;
    diagonalLines.forEach((line, i) => {
      const fontSize = i === 0 ? 13 : 10;
      const font = i === 0 ? helveticaBold : i >= 4 ? courier : helvetica;
      const textWidth = font.widthOfTextAtSize(line, fontSize);
      page.drawText(line, {
        x: width / 2 - textWidth / 2,
        y: startY - i * lineHeight,
        size: fontSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
        opacity: 0.3,
        rotate: degrees(35)
      });
    });
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: footerTotalHeight,
      color: rgb(0.06, 0.06, 0.06),
      opacity: 0.9
    });
    page.drawLine({
      start: { x: 0, y: footerTotalHeight },
      end: { x: width, y: footerTotalHeight },
      thickness: 0.5,
      color: rgb(0.72, 0.59, 0.05),
      opacity: 0.6
    });
    const line1FontSize = 7.5;
    const line1Width = helvetica.widthOfTextAtSize(footerLine1, line1FontSize);
    page.drawText(footerLine1, {
      x: width / 2 - line1Width / 2,
      y: footerTotalHeight - 13,
      size: line1FontSize,
      font: helvetica,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 1
    });
    const line2FontSize = 7.5;
    const line2Width = courier.widthOfTextAtSize(footerLine2, line2FontSize);
    page.drawText(footerLine2, {
      x: width / 2 - line2Width / 2,
      y: footerTotalHeight - 25,
      size: line2FontSize,
      font: courier,
      color: rgb(0.88, 0.88, 0.88),
      opacity: 1
    });
  }
  return pdfDoc.save();
}
async function createTextPdf(title, lines, opts) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;
  page.drawText(title, {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: rgb(0.05, 0.05, 0.05)
  });
  y -= 30;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7)
  });
  y -= 20;
  const footerClearance = 50;
  for (const line of lines) {
    if (y < margin + footerClearance) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = newPage.getSize().height - margin;
    }
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - margin * 2,
      lineHeight: 14
    });
    y -= 16;
  }
  const rawBytes = await pdfDoc.save();
  return applyWatermark(rawBytes, opts);
}

// server/routers.ts
import { v4 as uuidv4 } from "uuid";
import { createHash, randomBytes } from "crypto";

// server/scoring.ts
init_llm();
async function scoreApplication(app2) {
  const priorWorkStr = Array.isArray(app2.priorWork) && app2.priorWork.length > 0 ? app2.priorWork.map((w) => `- ${w.title}: ${w.url}`).join("\n") : "None provided";
  const prompt = `You are a vetting analyst for The Vault, a secure investigative database for journalists, researchers, and whistleblowers. Score this access application on 5 criteria (0-2 each, total 0-10).

APPLICATION DATA:
- Display Name/Handle: ${app2.displayName ?? "Not provided"}
- Email: ${app2.email ?? "Not provided"}
- Professional Profile URL: ${app2.profileUrl ?? "None"}
- Organization: ${app2.organization ?? "Independent/Anonymous"}
- Role/Title: ${app2.orgRole ?? "Not provided"}
- Organization Website: ${app2.orgWebsite ?? "None"}
- Prior Published Work:
${priorWorkStr}
- Investigation/Project: ${app2.investigationProject ?? "Not provided"}
- Geographic Focus: ${app2.geographicFocus ?? "Not provided"}
- Expected Output Type: ${app2.outputType ?? "Not provided"}
- Support Link (Ko-fi/Substack): ${app2.supportLink ?? "None"}
- Agrees to Credit The Vault: ${app2.agreesToCredit ? "Yes" : "No"}
- Currently Under Threats: ${app2.underThreats ?? "Not answered"}
- Uses OpSec Tools: ${app2.useOpSec ? "Yes" : "No"} (${app2.opSecTools ?? "not specified"})
- Previously Doxxed: ${app2.previouslyDoxxed ?? "Not answered"}
- Consents to Safety Outreach: ${app2.consentSafetyOutreach ? "Yes" : "No"}
- How they heard about The Vault: ${app2.referralSource ?? "Not provided"}
- Will share raw data publicly: ${app2.willShareRawData ? "Yes" : "No"}

SCORING CRITERIA:
1. IDENTITY & EMAIL (0-2):
   - 0: Disposable email, no verifiable footprint, no profile
   - 1: Mixed signals \u2014 some indicators but not fully verifiable
   - 2: Verified email domain, professional profile, clear digital footprint

2. ORGANIZATION LEGITIMACY (0-2):
   - 0: Cannot verify, fake, or clearly not legitimate
   - 1: Unclear, very small, or unverifiable organization
   - 2: Verifiable institution, newsroom, NGO, academic body, or credible independent journalist with prior work

3. PURPOSE & INTENDED USE (0-2):
   - 0: Vague, commercial, harmful, or misaligned with public interest
   - 1: Partially aligned \u2014 some public interest but lacks specificity
   - 2: Specific, concrete public-interest investigation with clear geographic focus and output type

4. SUPPORT & RECIPROCITY (0-2):
   - 0: No support link, no attribution agreement
   - 1: Agrees to credit only, no financial support
   - 2: Active Ko-fi/Substack/Patreon supporter AND agrees to credit The Vault

5. RISK & RED FLAGS (0-2):
   - 0: Clear red flags \u2014 vague purpose, refuses terms, suspicious patterns, will share raw data
   - 1: Minor concerns \u2014 some ambiguity but no clear red flags
   - 2: No red flags \u2014 clear purpose, strong OpSec awareness, responsible data use commitment

Respond with valid JSON only, no markdown:
{
  "scoreIdentity": <0-2>,
  "scoreOrganization": <0-2>,
  "scorePurpose": <0-2>,
  "scoreSupport": <0-2>,
  "scoreRisk": <0-2>,
  "rationale": "<2-3 sentence explanation of the overall assessment>",
  "recommendation": "<approve|review|deny>"
}`;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a vetting analyst. Respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vetting_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scoreIdentity: { type: "integer" },
              scoreOrganization: { type: "integer" },
              scorePurpose: { type: "integer" },
              scoreSupport: { type: "integer" },
              scoreRisk: { type: "integer" },
              rationale: { type: "string" },
              recommendation: { type: "string", enum: ["approve", "review", "deny"] }
            },
            required: ["scoreIdentity", "scoreOrganization", "scorePurpose", "scoreSupport", "scoreRisk", "rationale", "recommendation"],
            additionalProperties: false
          }
        }
      }
    });
    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error("No content from LLM");
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    const parsed = JSON.parse(content);
    const totalScore = parsed.scoreIdentity + parsed.scoreOrganization + parsed.scorePurpose + parsed.scoreSupport + parsed.scoreRisk;
    let recommendation = parsed.recommendation;
    if (totalScore >= 7) recommendation = "approve";
    else if (totalScore >= 4) recommendation = "review";
    else recommendation = "deny";
    return {
      scoreIdentity: Math.min(2, Math.max(0, parsed.scoreIdentity)),
      scoreOrganization: Math.min(2, Math.max(0, parsed.scoreOrganization)),
      scorePurpose: Math.min(2, Math.max(0, parsed.scorePurpose)),
      scoreSupport: Math.min(2, Math.max(0, parsed.scoreSupport)),
      scoreRisk: Math.min(2, Math.max(0, parsed.scoreRisk)),
      totalScore,
      rationale: parsed.rationale,
      recommendation
    };
  } catch (error) {
    console.error("[Scoring] AI scoring failed:", error);
    return {
      scoreIdentity: 1,
      scoreOrganization: 1,
      scorePurpose: 1,
      scoreSupport: 0,
      scoreRisk: 1,
      totalScore: 4,
      rationale: "Automatic scoring failed. Manual review required.",
      recommendation: "review"
    };
  }
}

// server/volunteerCertificate.ts
import { PDFDocument as PDFDocument2, rgb as rgb2, StandardFonts as StandardFonts2, degrees as degrees2 } from "pdf-lib";
import QRCode from "qrcode";
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
var DARK_BG = rgb2(0.039, 0.031, 0.024);
var GOLD = rgb2(0.898, 0.784, 0.478);
var GOLD_DIM = rgb2(0.784, 0.659, 0.298);
var WHITE = rgb2(1, 1, 1);
var LIGHT_GRAY = rgb2(0.8, 0.8, 0.8);
var MID_GRAY = rgb2(0.55, 0.55, 0.55);
function generateDocId(seq) {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return `VTI-${year}-${String(seq).padStart(4, "0")}`;
}
function getRoleLabel(role) {
  const map = {
    osint_research_trainee: "OSINT Research Trainee",
    data_verification_trainee: "Data Verification Trainee",
    digital_journalism_apprentice: "Digital Journalism Apprentice"
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatMonthYear(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
async function generateVolunteerCertificate(volunteerId) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(volunteerApplications).where(eq2(volunteerApplications.id, volunteerId)).limit(1);
  if (!rows.length) throw new Error(`Volunteer ${volunteerId} not found`);
  const vol = rows[0];
  const docId = vol.certificateDocId ?? generateDocId(volunteerId);
  const pdfDoc = await PDFDocument2.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const hBold = await pdfDoc.embedFont(StandardFonts2.HelveticaBold);
  const hReg = await pdfDoc.embedFont(StandardFonts2.Helvetica);
  const tRoman = await pdfDoc.embedFont(StandardFonts2.TimesRoman);
  const tItalic = await pdfDoc.embedFont(StandardFonts2.TimesRomanItalic);
  const tBoldIt = await pdfDoc.embedFont(StandardFonts2.TimesRomanBoldItalic);
  page.drawRectangle({ x: 0, y: 0, width, height, color: DARK_BG });
  const wmLines = [
    "THE VAULT INVESTIGATES",
    `OFFICIAL DOCUMENT  ${docId}`
  ];
  const wmSize = 10;
  const stepX = 170;
  const stepY = 58;
  for (let row = -3; row < 14; row++) {
    for (let col = -2; col < 7; col++) {
      const txt = wmLines[(row % 2 + 2) % 2];
      page.drawText(txt, {
        x: col * stepX + (row % 2 === 0 ? 0 : 85),
        y: row * stepY,
        size: wmSize,
        font: hBold,
        color: GOLD_DIM,
        opacity: 0.11,
        rotate: degrees2(35)
      });
    }
  }
  const op = 18;
  const ip = 27;
  page.drawRectangle({
    x: op,
    y: op,
    width: width - op * 2,
    height: height - op * 2,
    borderColor: GOLD_DIM,
    borderWidth: 1.4,
    opacity: 0,
    borderOpacity: 0.75
  });
  page.drawRectangle({
    x: ip,
    y: ip,
    width: width - ip * 2,
    height: height - ip * 2,
    borderColor: GOLD_DIM,
    borderWidth: 0.6,
    opacity: 0,
    borderOpacity: 0.45
  });
  const cl = 20;
  const cp = op + 10;
  const cLines = [
    // TL
    [cp, height - cp, cp + cl, height - cp],
    [cp, height - cp, cp, height - cp - cl],
    // TR
    [width - cp - cl, height - cp, width - cp, height - cp],
    [width - cp, height - cp, width - cp, height - cp - cl],
    // BL
    [cp, cp, cp + cl, cp],
    [cp, cp, cp, cp + cl],
    // BR
    [width - cp - cl, cp, width - cp, cp],
    [width - cp, cp, width - cp, cp + cl]
  ];
  for (const [x1, y1, x2, y2] of cLines) {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 1.6,
      color: GOLD,
      opacity: 0.85
    });
  }
  const hdrTxt = "THE VAULT INVESTIGATES";
  const hdrSz = 11;
  const hdrW = hBold.widthOfTextAtSize(hdrTxt, hdrSz);
  page.drawText(hdrTxt, {
    x: (width - hdrW) / 2,
    y: height - 78,
    size: hdrSz,
    font: hBold,
    color: GOLD,
    opacity: 0.9
  });
  const titleTxt = "Certificate of Accomplishment";
  const titleSz = 38;
  const titleW = tBoldIt.widthOfTextAtSize(titleTxt, titleSz);
  page.drawText(titleTxt, {
    x: (width - titleW) / 2,
    y: height - 128,
    size: titleSz,
    font: tBoldIt,
    color: WHITE
  });
  page.drawLine({
    start: { x: 80, y: height - 146 },
    end: { x: width - 80, y: height - 146 },
    thickness: 0.7,
    color: GOLD_DIM,
    opacity: 0.55
  });
  const ctTxt = "THIS CERTIFIES THAT";
  const ctSz = 9;
  const ctW = hBold.widthOfTextAtSize(ctTxt, ctSz);
  page.drawText(ctTxt, {
    x: (width - ctW) / 2,
    y: height - 183,
    size: ctSz,
    font: hBold,
    color: GOLD_DIM,
    opacity: 0.85
  });
  const nbW = 560;
  const nbH = 48;
  const nbX = (width - nbW) / 2;
  const nbY = height - 248;
  page.drawRectangle({
    x: nbX,
    y: nbY,
    width: nbW,
    height: nbH,
    borderColor: GOLD_DIM,
    borderWidth: 0.8,
    opacity: 0,
    borderOpacity: 0.5
  });
  const nameSz = 26;
  const nameW = tItalic.widthOfTextAtSize(vol.fullName, nameSz);
  page.drawText(vol.fullName, {
    x: (width - nameW) / 2,
    y: nbY + (nbH - nameSz) / 2 + 4,
    size: nameSz,
    font: tItalic,
    color: WHITE
  });
  const hscTxt = "HAS SUCCESSFULLY COMPLETED";
  const hscSz = 9;
  const hscW = hBold.widthOfTextAtSize(hscTxt, hscSz);
  page.drawText(hscTxt, {
    x: (width - hscW) / 2,
    y: nbY - 26,
    size: hscSz,
    font: hBold,
    color: GOLD_DIM,
    opacity: 0.85
  });
  const roleTxt = getRoleLabel(vol.role ?? "");
  const roleSz = 18;
  const roleW = hBold.widthOfTextAtSize(roleTxt, roleSz);
  page.drawText(roleTxt, {
    x: (width - roleW) / 2,
    y: nbY - 58,
    size: roleSz,
    font: hBold,
    color: GOLD
  });
  const progTxt = "Civic Journalism Fellowship Program";
  const progSz = 13;
  const progW = tRoman.widthOfTextAtSize(progTxt, progSz);
  page.drawText(progTxt, {
    x: (width - progW) / 2,
    y: nbY - 82,
    size: progSz,
    font: tRoman,
    color: LIGHT_GRAY
  });
  const invTxt = "The Vault Investigates \u2014 Seeds of Fire Investigation";
  const invSz = 12;
  const invW = tRoman.widthOfTextAtSize(invTxt, invSz);
  page.drawText(invTxt, {
    x: (width - invW) / 2,
    y: nbY - 102,
    size: invSz,
    font: tRoman,
    color: LIGHT_GRAY,
    opacity: 0.8
  });
  const hours = vol.hoursCompleted ?? 0;
  const issuedDate = vol.certificateIssuedAt ?? /* @__PURE__ */ new Date();
  const hrsTxt = `${hours} hours \xB7 ${formatMonthYear(issuedDate)}`;
  const hrsSz = 11;
  const hrsW = tRoman.widthOfTextAtSize(hrsTxt, hrsSz);
  page.drawText(hrsTxt, {
    x: (width - hrsW) / 2,
    y: nbY - 122,
    size: hrsSz,
    font: tRoman,
    color: MID_GRAY
  });
  page.drawLine({
    start: { x: 80, y: 132 },
    end: { x: width - 80, y: 132 },
    thickness: 0.7,
    color: GOLD_DIM,
    opacity: 0.5
  });
  const sx = 160;
  const sy = 90;
  const sr = 36;
  page.drawCircle({ x: sx, y: sy, size: sr, borderColor: GOLD_DIM, borderWidth: 1.5, opacity: 0, borderOpacity: 0.7 });
  page.drawCircle({ x: sx, y: sy, size: sr - 7, borderColor: GOLD_DIM, borderWidth: 0.8, opacity: 0, borderOpacity: 0.5 });
  const s1 = "THE";
  const s1W = hBold.widthOfTextAtSize(s1, 8);
  page.drawText(s1, { x: sx - s1W / 2, y: sy + 5, size: 8, font: hBold, color: GOLD, opacity: 0.9 });
  const s2 = "VAULT";
  const s2W = hBold.widthOfTextAtSize(s2, 8);
  page.drawText(s2, { x: sx - s2W / 2, y: sy - 7, size: 8, font: hBold, color: GOLD, opacity: 0.9 });
  const slX1 = 220;
  const slX2 = 480;
  const slY = 102;
  page.drawLine({ start: { x: slX1, y: slY }, end: { x: slX2, y: slY }, thickness: 0.8, color: GOLD_DIM, opacity: 0.6 });
  const sigTxt = "Lead Investigator, The Vault Investigates";
  const sigSz = 11;
  const sigW = tItalic.widthOfTextAtSize(sigTxt, sigSz);
  page.drawText(sigTxt, {
    x: (slX1 + slX2) / 2 - sigW / 2,
    y: slY - 16,
    size: sigSz,
    font: tItalic,
    color: LIGHT_GRAY,
    opacity: 0.85
  });
  const dbW = 160;
  const dbH = 28;
  const dbX = width - 80 - dbW;
  const dbY = 84;
  const dlTxt = "DOCUMENT ID";
  const dlSz = 8;
  const dlW = hBold.widthOfTextAtSize(dlTxt, dlSz);
  page.drawText(dlTxt, {
    x: dbX + (dbW - dlW) / 2,
    y: dbY + dbH + 4,
    size: dlSz,
    font: hBold,
    color: GOLD_DIM,
    opacity: 0.8
  });
  page.drawRectangle({
    x: dbX,
    y: dbY,
    width: dbW,
    height: dbH,
    borderColor: GOLD_DIM,
    borderWidth: 1,
    opacity: 0,
    borderOpacity: 0.7
  });
  const diSz = 13;
  const diW = hBold.widthOfTextAtSize(docId, diSz);
  page.drawText(docId, {
    x: dbX + (dbW - diW) / 2,
    y: dbY + (dbH - diSz) / 2 + 2,
    size: diSz,
    font: hBold,
    color: GOLD
  });
  const schoolTxt = `${vol.schoolName} \xB7 ${vol.city}`;
  const schoolSz = 9;
  const schoolW = hReg.widthOfTextAtSize(schoolTxt, schoolSz);
  page.drawText(schoolTxt, {
    x: (width - schoolW) / 2,
    y: 52,
    size: schoolSz,
    font: hReg,
    color: MID_GRAY,
    opacity: 0.65
  });
  const vfTxt = `VERIFY AT: VET.THEVAULTINVESTIGATES.CLOUD/VERIFY  \xB7  DOCUMENT ID REQUIRED`;
  const vfSz = 7.5;
  const vfW = hReg.widthOfTextAtSize(vfTxt, vfSz);
  page.drawText(vfTxt, {
    x: (width - vfW) / 2,
    y: 36,
    size: vfSz,
    font: hReg,
    color: MID_GRAY,
    opacity: 0.65
  });
  const verifyUrl = `https://vet.thevaultinvestigates.cloud/verify?id=${docId}`;
  try {
    const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      type: "png",
      width: 80,
      margin: 1,
      color: { dark: "#e5c87a", light: "#0a090500" }
      // gold on transparent
    });
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);
    const qrSize = 56;
    const qrX = width - 80 - 160 / 2 - qrSize / 2 + 160 / 2 + 4;
    const qrY = dbY + dbH + 10;
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  } catch (qrErr) {
    console.warn("[Certificate] QR code generation failed (non-fatal):", qrErr);
  }
  const pdfBytes = await pdfDoc.save();
  const key = `certificates/${docId}-${Date.now()}.pdf`;
  const { url } = await storagePut(key, Buffer.from(pdfBytes), "application/pdf");
  await db.update(volunteerApplications).set({
    certificateFileUrl: url,
    certificateIssuedAt: /* @__PURE__ */ new Date(),
    ...vol.certificateDocId ? {} : { certificateDocId: docId }
  }).where(eq2(volunteerApplications.id, volunteerId));
  return { url, key, docId };
}

// server/programDocumentPdf.ts
import { PDFDocument as PDFDocument3, rgb as rgb3, StandardFonts as StandardFonts3, degrees as degrees3 } from "pdf-lib";
import QRCode2 from "qrcode";
var DARK_BG2 = rgb3(0.039, 0.031, 0.024);
var GOLD2 = rgb3(0.898, 0.784, 0.478);
var GOLD_DIM2 = rgb3(0.784, 0.659, 0.298);
var WHITE2 = rgb3(1, 1, 1);
var LIGHT_GRAY2 = rgb3(0.75, 0.75, 0.75);
var MID_GRAY2 = rgb3(0.5, 0.5, 0.5);
var DOC_LABELS = {
  consent_form: "Parental / Guardian Consent Form",
  confidentiality_agreement: "Research Confidentiality Agreement & NDA",
  release_of_liability: "Release of Liability & Assumption of Risk",
  sample_research_task: "Sample Research Task \u2014 OSINT Research Trainee",
  program_summary: "Program Summary"
};
var DOC_SUBTITLES = {
  consent_form: "Civic Journalism Fellowship Program \xB7 The Vault Investigates",
  confidentiality_agreement: "Civic Journalism Fellowship Program \xB7 The Vault Investigates",
  release_of_liability: "Civic Journalism Fellowship Program \xB7 The Vault Investigates",
  sample_research_task: "Civic Journalism Fellowship Program \xB7 The Vault Investigates",
  program_summary: "Civic Journalism Fellowship Program \xB7 The Vault Investigates"
};
var _seq = Math.floor(Math.random() * 9e3) + 1e3;
function generateDocId2() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return `VTI-DOC-${year}-${String(_seq++).padStart(4, "0")}`;
}
async function drawWatermark(page, font, docId) {
  const { width, height } = page.getSize();
  const text2 = `THE VAULT INVESTIGATES \xB7 OFFICIAL DOCUMENT \xB7 ${docId}`;
  const fontSize = 9;
  const opacity = 0.07;
  const spacing = 110;
  for (let y = -spacing; y < height + spacing; y += spacing) {
    for (let x = -spacing; x < width + spacing; x += spacing) {
      page.drawText(text2, {
        x,
        y,
        size: fontSize,
        font,
        color: GOLD2,
        rotate: degrees3(35),
        opacity
      });
    }
  }
}
function drawBorder(page) {
  const { width, height } = page.getSize();
  const m = 18;
  const m2 = 26;
  page.drawRectangle({ x: m, y: m, width: width - m * 2, height: height - m * 2, borderColor: GOLD2, borderWidth: 1.5, color: void 0 });
  page.drawRectangle({ x: m2, y: m2, width: width - m2 * 2, height: height - m2 * 2, borderColor: GOLD_DIM2, borderWidth: 0.5, color: void 0 });
}
async function drawHeader(page, boldFont, regularFont, docType, docId) {
  const { width, height } = page.getSize();
  const topY = height - 60;
  const orgText = "THE VAULT INVESTIGATES";
  const orgW = boldFont.widthOfTextAtSize(orgText, 9);
  page.drawText(orgText, { x: (width - orgW) / 2, y: topY, size: 9, font: boldFont, color: GOLD2, opacity: 0.9 });
  const titleText = DOC_LABELS[docType];
  const titleSize = 18;
  const titleW = boldFont.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, { x: (width - titleW) / 2, y: topY - 26, size: titleSize, font: boldFont, color: WHITE2 });
  const subText = DOC_SUBTITLES[docType];
  const subW = regularFont.widthOfTextAtSize(subText, 9);
  page.drawText(subText, { x: (width - subW) / 2, y: topY - 46, size: 9, font: regularFont, color: LIGHT_GRAY2 });
  page.drawLine({ start: { x: 50, y: topY - 56 }, end: { x: width - 50, y: topY - 56 }, thickness: 0.5, color: GOLD_DIM2, opacity: 0.6 });
  const idLabel = "DOCUMENT ID";
  const idLabelW = regularFont.widthOfTextAtSize(idLabel, 7);
  const idW = boldFont.widthOfTextAtSize(docId, 9);
  const badgeX = width - 160;
  const badgeY = topY - 10;
  page.drawRectangle({ x: badgeX - 6, y: badgeY - 14, width: Math.max(idW, idLabelW) + 12, height: 28, borderColor: GOLD_DIM2, borderWidth: 0.5, color: rgb3(0.08, 0.065, 0.045) });
  page.drawText(idLabel, { x: badgeX, y: badgeY + 8, size: 7, font: regularFont, color: MID_GRAY2 });
  page.drawText(docId, { x: badgeX, y: badgeY - 6, size: 9, font: boldFont, color: GOLD2 });
}
function wrapText(text2, font, size, maxWidth) {
  const words = text2.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
async function renderContent(pdfDoc, boldFont, regularFont, italicFont, docType, docId) {
  const pageWidth = 612;
  const pageHeight = 792;
  const leftMargin = 60;
  const rightMargin = 60;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  const bodyStartY = pageHeight - 130;
  const bottomMargin = 80;
  const sections = getDocumentSections(docType, docId);
  let page = pdfDoc.getPage(0);
  let y = bodyStartY;
  const newPage = () => {
    const p = pdfDoc.addPage([pageWidth, pageHeight]);
    p.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: DARK_BG2 });
    drawBorder(p);
    drawWatermark(p, boldFont, docId);
    drawFooter(p, regularFont, docId);
    return p;
  };
  const ensureSpace = (needed) => {
    if (y - needed < bottomMargin) {
      page = newPage();
      y = pageHeight - 60;
    }
  };
  for (const section of sections) {
    if (section.type === "heading") {
      ensureSpace(30);
      const size = section.level === 1 ? 13 : 11;
      const color = section.level === 1 ? GOLD2 : WHITE2;
      const font = boldFont;
      page.drawText(section.text, { x: leftMargin, y, size, font, color });
      y -= size + 10;
      if (section.level === 1) {
        page.drawLine({ start: { x: leftMargin, y: y + 4 }, end: { x: pageWidth - rightMargin, y: y + 4 }, thickness: 0.4, color: GOLD_DIM2, opacity: 0.5 });
        y -= 8;
      }
    } else if (section.type === "paragraph") {
      const lines = wrapText(section.text, regularFont, 9, contentWidth);
      ensureSpace(lines.length * 13 + 8);
      for (const line of lines) {
        page.drawText(line, { x: leftMargin, y, size: 9, font: regularFont, color: LIGHT_GRAY2 });
        y -= 13;
      }
      y -= 6;
    } else if (section.type === "bullet") {
      const lines = wrapText(section.text, regularFont, 9, contentWidth - 16);
      ensureSpace(lines.length * 13 + 4);
      page.drawText("\u2022", { x: leftMargin + 4, y, size: 9, font: boldFont, color: GOLD_DIM2 });
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], { x: leftMargin + 16, y: y - i * 13, size: 9, font: regularFont, color: LIGHT_GRAY2 });
      }
      y -= lines.length * 13 + 2;
    } else if (section.type === "spacer") {
      y -= section.height ?? 12;
    } else if (section.type === "signature_line") {
      ensureSpace(40);
      page.drawLine({ start: { x: leftMargin, y: y - 8 }, end: { x: leftMargin + 200, y: y - 8 }, thickness: 0.5, color: GOLD_DIM2, opacity: 0.7 });
      page.drawText(section.text, { x: leftMargin, y: y - 20, size: 8, font: regularFont, color: MID_GRAY2 });
      y -= 36;
    } else if (section.type === "note") {
      const lines = wrapText(section.text, italicFont, 8, contentWidth - 20);
      ensureSpace(lines.length * 12 + 16);
      page.drawRectangle({ x: leftMargin, y: y - lines.length * 12 - 4, width: contentWidth, height: lines.length * 12 + 12, color: rgb3(0.08, 0.065, 0.045), borderColor: GOLD_DIM2, borderWidth: 0.4 });
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], { x: leftMargin + 8, y: y - i * 12, size: 8, font: italicFont, color: LIGHT_GRAY2 });
      }
      y -= lines.length * 12 + 20;
    }
  }
}
function drawFooter(page, font, docId) {
  const { width } = page.getSize();
  const footerY = 38;
  page.drawLine({ start: { x: 50, y: footerY + 14 }, end: { x: width - 50, y: footerY + 14 }, thickness: 0.4, color: GOLD_DIM2, opacity: 0.5 });
  const text2 = `VERIFY AT: VET.THEVAULTINVESTIGATES.CLOUD/VERIFY \xB7 DOCUMENT ID: ${docId}`;
  const tw = font.widthOfTextAtSize(text2, 6.5);
  page.drawText(text2, { x: (width - tw) / 2, y: footerY, size: 6.5, font, color: MID_GRAY2, opacity: 0.8 });
}
function getDocumentSections(docType, docId) {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  if (docType === "consent_form") {
    return [
      { type: "note", text: "Please read this form carefully before signing. Contact vaultinvestigates@protonmail.com with any questions before returning this form." },
      { type: "spacer", height: 10 },
      { type: "heading", text: "About the Program", level: 1 },
      { type: "paragraph", text: "The Vault Investigates is an independent investigative journalism publication. The Civic Journalism Fellowship Program is a structured volunteer research program for academically motivated high school students. Students contribute to active, published investigations by performing open-source research tasks under direct supervision." },
      { type: "paragraph", text: "The program is fully remote and asynchronous. There are no fixed meeting times, no travel requirements, and no financial costs to students or families." },
      { type: "heading", text: "What Your Child Will Do", level: 1 },
      { type: "bullet", text: "Perform structured research tasks using publicly available sources only" },
      { type: "bullet", text: "Submit documented deliverables through the program portal" },
      { type: "bullet", text: "Receive written feedback from the Lead Investigator" },
      { type: "bullet", text: "Earn a signed Certificate of Accomplishment with a unique verifiable Document ID upon completion" },
      { type: "heading", text: "What Your Child Will NOT Do", level: 1 },
      { type: "bullet", text: "Contact, interview, or communicate with confidential sources or whistleblowers" },
      { type: "bullet", text: "Access, handle, or process sensitive personal data belonging to third parties" },
      { type: "bullet", text: "Participate in any politically affiliated, partisan, or advocacy-related work" },
      { type: "bullet", text: "Attend in-person meetings, events, or field visits of any kind" },
      { type: "bullet", text: "Incur any financial cost or obligation" },
      { type: "heading", text: "Program Details", level: 1 },
      { type: "bullet", text: "Duration: 4\u20138 weeks, fully asynchronous, approximately 10\u201320 hours total" },
      { type: "bullet", text: "Language: English" },
      { type: "bullet", text: "Cost: None" },
      { type: "bullet", text: "Contact: vaultinvestigates@protonmail.com" },
      { type: "bullet", text: `Program portal: vet.thevaultinvestigates.cloud/volunteer` },
      { type: "heading", text: "Parent / Guardian Consent", level: 1 },
      { type: "paragraph", text: "By signing below, I confirm that I have read and understood this consent form and give my consent for my child to participate in the Civic Journalism Fellowship Program." },
      { type: "spacer", height: 8 },
      { type: "signature_line", text: "Student Full Name" },
      { type: "signature_line", text: "School Name" },
      { type: "signature_line", text: "Grade Level" },
      { type: "signature_line", text: "Parent / Guardian Full Name" },
      { type: "signature_line", text: "Relationship to Student" },
      { type: "signature_line", text: "Parent / Guardian Signature & Date" },
      { type: "signature_line", text: "Student Signature & Date" },
      { type: "spacer", height: 8 },
      { type: "note", text: `Form version: April ${year} \xB7 The Vault Investigates \xB7 Document ID: ${docId}` }
    ];
  }
  if (docType === "confidentiality_agreement") {
    return [
      { type: "note", text: "This strict Non-Disclosure Agreement (NDA) protects the active, sensitive investigations of The Vault EcoSystem. It does not restrict your child from claiming the experience on college applications or resumes, but strictly forbids exporting or discussing case details." },
      { type: "spacer", height: 10 },
      { type: "heading", text: "1. Purpose & Scope", level: 1 },
      { type: "paragraph", text: "The Vault Investigates conducts active investigative journalism. The integrity of an ongoing investigation depends on absolute confidentiality. This agreement defines what is confidential, what the student agrees to protect, and the strict rules against exporting or discussing leads or investigation details outside of the official, secure Vault EcoSystem." },
      { type: "heading", text: "2. Confidential Information", level: 1 },
      { type: "bullet", text: "The identity of any individual, company, or organization being researched, where not yet publicly disclosed" },
      { type: "bullet", text: "The specific research direction, leads, methodology, or strategy of the assigned investigation" },
      { type: "bullet", text: "Internal communications between the student and the Lead Investigator or other team members" },
      { type: "bullet", text: "Any unpublished findings, draft documents, database entries, or interim research conclusions" },
      { type: "bullet", text: "The identity of any other student trainees, volunteers, or sources in the program" },
      { type: "heading", text: "3. Strict EcoSystem Boundaries & Restrictions", level: 1 },
      { type: "bullet", text: "The student shall NOT discuss, post, or share any active investigations, leads, or case files on social media, personal messaging apps, or any platform outside of the official communication channels of The Vault EcoSystem." },
      { type: "bullet", text: "The student shall NOT take, print, screenshot, download, copy, or export any leads, files, database records, or investigation materials for use outside of The Vault EcoSystem." },
      { type: "bullet", text: "All research and work must be conducted solely within the provided secure web portals and official tools. Transfer of any investigative material to external personal drives, local folders, or public storage is strictly prohibited." },
      { type: "heading", text: "4. What This Agreement Does NOT Restrict", level: 1 },
      { type: "bullet", text: "Disclosing participation in the Fellowship Program on college applications, resumes, or professional profiles" },
      { type: "bullet", text: "Discussing general skills learned (such as OSINT, public records search, and document verification)" },
      { type: "bullet", text: "Reporting any safety, ethical, or program-related concern to a parent, school counselor, or legal authority" },
      { type: "heading", text: "5. Student Obligations & Enforcement", level: 1 },
      { type: "paragraph", text: "The student agrees, for the duration of the program and for twelve (12) months following completion, to maintain absolute confidentiality. Any violation of these terms\u2014including exporting data, printing files, or discussing leads externally\u2014will result in immediate termination from the program, revocation of all certificates, notification to the student's school administration, and potential legal action under applicable laws of the Republic of the Philippines." },
      { type: "heading", text: "6. Duration & Governing Law", level: 1 },
      { type: "paragraph", text: `This agreement is effective from the date of signature and remains in force for twelve (12) months following the conclusion of the student's participation. It is governed by the laws of the Republic of the Philippines.` },
      { type: "heading", text: "7. Signatures & Co-Signature", level: 1 },
      { type: "paragraph", text: "Because the student is a minor, this agreement requires co-signature by a parent or legal guardian to be legally binding." },
      { type: "spacer", height: 8 },
      { type: "signature_line", text: "Student Full Name" },
      { type: "signature_line", text: "School Name" },
      { type: "signature_line", text: "Student Signature & Date" },
      { type: "signature_line", text: "Parent / Guardian Full Name" },
      { type: "signature_line", text: "Parent / Guardian Signature & Date" },
      { type: "signature_line", text: "Lead Investigator Signature & Date" },
      { type: "spacer", height: 8 },
      { type: "note", text: `Agreement version: June ${year} (Strict EcoSystem NDA) \xB7 The Vault Investigates \xB7 Document ID: ${docId}` }
    ];
  }
  if (docType === "release_of_liability") {
    return [
      { type: "note", text: "This Release of Liability and Assumption of Risk is a mandatory legal form for participation in the Civic Journalism Fellowship Program. It must be signed by both the student and their parent/guardian." },
      { type: "spacer", height: 10 },
      { type: "heading", text: "1. Voluntary Participation", level: 1 },
      { type: "paragraph", text: "I, the parent/guardian, along with my child (the student), acknowledge that participation in the Civic Journalism Fellowship Program is entirely voluntary. We understand that this is an educational, remote, and asynchronous volunteer fellowship program, and does not constitute employment or create any employment relationship." },
      { type: "heading", text: "2. Assumption of Risk", level: 1 },
      { type: "paragraph", text: "We understand that the program involves online open-source research (OSINT), data verification, and document analysis using publicly available sources. While all tasks are remote and strictly supervised, we assume all risks associated with online research, computer use, and digital collaboration in connection with the program." },
      { type: "heading", text: "3. Release, Waiver & Hold Harmless", level: 1 },
      { type: "paragraph", text: "In consideration of the student being permitted to participate in the program, we hereby release, waive, and forever discharge The Vault Investigates, its Lead Investigator, its editorial staff, and all associated entities from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury that may be sustained by the student during or as a result of their participation in the program." },
      { type: "heading", text: "4. No Compensation or Benefits", level: 1 },
      { type: "paragraph", text: "We acknowledge and agree that the student is participating as a volunteer trainee for educational purposes. The student is not entitled to any financial compensation, wages, stipend, or health/accident insurance benefits. No promise of future employment, paid roles, or compensation has been made." },
      { type: "heading", text: "5. Integrity & Portal Usage", level: 1 },
      { type: "paragraph", text: "We agree that the student will adhere to all program guidelines, honor codes, and safety protocols. All work must be submitted through the official portal. The Vault Investigates reserves the right to terminate the student's participation at any time for non-compliance with guidelines, ethical violations, or breach of confidentiality." },
      { type: "heading", text: "6. Acknowledgment of Understanding", level: 1 },
      { type: "paragraph", text: "By signing below, we confirm that we have read this Release of Liability and Assumption of Risk, fully understand its terms, and understand that we are giving up substantial rights, including the right to sue." },
      { type: "spacer", height: 8 },
      { type: "signature_line", text: "Student Full Name" },
      { type: "signature_line", text: "School Name" },
      { type: "signature_line", text: "Student Signature & Date" },
      { type: "signature_line", text: "Parent / Guardian Full Name" },
      { type: "signature_line", text: "Parent / Guardian Signature & Date" },
      { type: "spacer", height: 8 },
      { type: "note", text: `Release version: June ${year} \xB7 The Vault Investigates \xB7 Document ID: ${docId}` }
    ];
  }
  return [
    { type: "note", text: "This is a sanitized sample of the type of task assigned to student trainees. All sources referenced are publicly available. No confidential information, sensitive personal data, or restricted materials are involved." },
    { type: "spacer", height: 10 },
    { type: "heading", text: "Task Overview", level: 1 },
    { type: "bullet", text: "Track: OSINT Research Trainee" },
    { type: "bullet", text: "Difficulty: Introductory" },
    { type: "bullet", text: "Estimated time: 3\u20135 hours" },
    { type: "bullet", text: "Tools required: Web browser, word processor or Google Docs" },
    { type: "bullet", text: "Cost: None" },
    { type: "heading", text: "Background", level: 1 },
    { type: "paragraph", text: "The Vault Investigates tracks YouTube channels that publish content depicting poverty in the Philippines. Part of our research involves building a factual profile of each channel \u2014 its registration status, revenue model, and audience reach. This information is gathered entirely from public sources: YouTube platform data, business registration databases, and publicly available regulatory records." },
    { type: "heading", text: "Your Assignment", level: 1 },
    { type: "paragraph", text: "You will be assigned one YouTube channel (provided by the Lead Investigator). Using only the public sources listed below, you will compile a structured Channel Profile Report. You will not contact the channel operator or any person associated with the channel." },
    { type: "heading", text: "Step 1 \u2014 YouTube Channel Data", level: 2 },
    { type: "bullet", text: "Channel name, handle, subscriber count, total video count" },
    { type: "bullet", text: "Date channel was created (YouTube About tab > Joined)" },
    { type: "bullet", text: "Country listed, channel description, links in About tab" },
    { type: "bullet", text: "Most recent 5 video titles; most viewed video title and view count" },
    { type: "heading", text: "Step 2 \u2014 Social Media Cross-Reference", level: 2 },
    { type: "bullet", text: "Search for the channel on: Facebook, Instagram, TikTok, X (Twitter), Patreon" },
    { type: "bullet", text: "Record: whether an account exists, username, follower count, and link" },
    { type: "heading", text: "Step 3 \u2014 Business Registration Search", level: 2 },
    { type: "bullet", text: "SEC Philippines (sec.gov.ph) \u2014 search channel operator name" },
    { type: "bullet", text: "DTI Business Name Registry (bnrs.dti.gov.ph) \u2014 same search" },
    { type: "bullet", text: "DSWD NGO Registry (dswd.gov.ph) \u2014 same search" },
    { type: "bullet", text: "Record: search term used, date, and result (found / not found / inconclusive)" },
    { type: "heading", text: "Step 4 \u2014 Revenue Model Documentation", level: 2 },
    { type: "bullet", text: "Document all visible revenue streams: YouTube ads, memberships, Patreon, merchandise, GoFundMe, PayPal, sponsored content disclosures" },
    { type: "heading", text: "Submission Checklist", level: 1 },
    { type: "bullet", text: "All five sections of the report template completed" },
    { type: "bullet", text: "Every data point has a source URL and access date" },
    { type: "bullet", text: "No opinions or interpretations \u2014 documented facts only" },
    { type: "bullet", text: "No contact made with any individual associated with the channel" },
    { type: "heading", text: "Questions", level: 1 },
    { type: "paragraph", text: "Email the Lead Investigator at vaultinvestigates@protonmail.com with the subject line: Task Question \u2014 [Your Name] \u2014 [Task ID]. Response time is typically within 2 business days." },
    { type: "spacer", height: 8 },
    { type: "note", text: `Sample Task version: April ${year} \xB7 The Vault Investigates \xB7 Document ID: ${docId} \xB7 Cleared for distribution to school principals, parents, and prospective student applicants.` }
  ];
  if (docType === "program_summary") return [
    { type: "note", text: "This document is cleared for distribution to school principals, parents, scholarship committees, and prospective student applicants." },
    { type: "spacer", height: 10 },
    { type: "heading", text: "What Is This Program?", level: 1 },
    { type: "paragraph", text: "The Civic Journalism Fellowship Program is a structured volunteer research program for academically motivated high school students in Manila. Students contribute to The Vault Investigates \u2014 an independent investigative journalism publication \u2014 by performing open-source research tasks on active, published investigations." },
    { type: "paragraph", text: "The program is fully remote, asynchronous, and free. There are no fixed meeting times, no travel requirements, and no financial costs to students or families." },
    { type: "heading", text: "What Students Do", level: 1 },
    { type: "bullet", text: "Perform structured research tasks using publicly available sources only" },
    { type: "bullet", text: "Submit documented deliverables through the program portal" },
    { type: "bullet", text: "Receive written feedback from the Lead Investigator" },
    { type: "bullet", text: "Earn a signed Certificate of Accomplishment with a unique verifiable Document ID" },
    { type: "heading", text: "What Students Do NOT Do", level: 1 },
    { type: "bullet", text: "Contact confidential sources or whistleblowers" },
    { type: "bullet", text: "Handle sensitive personal data belonging to third parties" },
    { type: "bullet", text: "Participate in any politically affiliated or advocacy-related work" },
    { type: "bullet", text: "Attend in-person meetings or field visits" },
    { type: "bullet", text: "Incur any financial cost or obligation" },
    { type: "heading", text: "Available Roles", level: 1 },
    { type: "bullet", text: "Junior OSINT Research Trainee \u2014 4-6 hrs/week" },
    { type: "bullet", text: "Data Verification Trainee \u2014 2-4 hrs/week" },
    { type: "bullet", text: "Digital Journalism Apprentice \u2014 4-8 hrs/week" },
    { type: "heading", text: "Program Details", level: 1 },
    { type: "bullet", text: "Duration: 4-8 weeks, fully asynchronous" },
    { type: "bullet", text: "Language: English" },
    { type: "bullet", text: "Eligibility: Grade 11-12 students in Manila, ages 15-20" },
    { type: "bullet", text: "Cost: None" },
    { type: "heading", text: "The Certificate", level: 1 },
    { type: "paragraph", text: "Every student who completes the program receives a signed Certificate of Accomplishment with a unique Document ID. Certificates are verifiable online at vet.thevaultinvestigates.cloud/verify \u2014 suitable for college applications and scholarship portfolios." },
    { type: "heading", text: "Apply or Learn More", level: 1 },
    { type: "bullet", text: "Program portal: vet.thevaultinvestigates.cloud/volunteer" },
    { type: "bullet", text: "Contact: vaultinvestigates@protonmail.com" },
    { type: "bullet", text: "Publication: thevaultinvestigates.cloud" },
    { type: "spacer", height: 8 },
    { type: "note", text: `Program Summary \xB7 ${year} \xB7 The Vault Investigates \xB7 Document ID: ${docId}` }
  ];
  return [];
}
async function generateProgramDocument(docType) {
  const docId = generateDocId2();
  const pageWidth = 612;
  const pageHeight = 792;
  const pdfDoc = await PDFDocument3.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const boldFont = await pdfDoc.embedFont(StandardFonts3.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts3.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts3.HelveticaOblique);
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: DARK_BG2 });
  await drawWatermark(page, boldFont, docId);
  drawBorder(page);
  await drawHeader(page, boldFont, regularFont, docType, docId);
  drawFooter(page, regularFont, docId);
  const verifyUrl = `https://vet.thevaultinvestigates.cloud/verify?id=${docId}`;
  try {
    const qrDataUrl = await QRCode2.toDataURL(verifyUrl, {
      width: 64,
      margin: 1,
      color: { dark: "#e5c87a", light: "#00000000" }
    });
    const qrBase64 = qrDataUrl.replace("data:image/png;base64,", "");
    const qrBytes = Buffer.from(qrBase64, "base64");
    const qrImage = await pdfDoc.embedPng(qrBytes);
    page.drawImage(qrImage, { x: pageWidth - 80, y: 44, width: 52, height: 52 });
  } catch {
  }
  await renderContent(pdfDoc, boldFont, regularFont, italicFont, docType, docId);
  const pdfBytes = await pdfDoc.save();
  const fileKey = `program-docs/${docType}-${docId}.pdf`;
  const { url } = await storagePut(fileKey, Buffer.from(pdfBytes), "application/pdf");
  return { url, docId };
}

// server/routers.ts
init_email();
init_db();
init_env();

// server/_core/dataApi.ts
init_env();
async function callDataApi(apiId, options = {}) {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("webdevtoken.v1.WebDevService/CallApi", baseUrl).toString();
  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify({
      apiId,
      query: options.query,
      body: options.body,
      path_params: options.pathParams,
      multipart_form_data: options.formData
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Data API request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }
  const payload = await response.json().catch(() => ({}));
  if (payload && typeof payload === "object" && "jsonData" in payload) {
    try {
      return JSON.parse(payload.jsonData ?? "{}");
    } catch {
      return payload.jsonData;
    }
  }
  return payload;
}

// server/weeklyOpsDb.ts
init_db();
init_schema();
import { eq as eq3, and as and2 } from "drizzle-orm";
function getCurrentWeekStart() {
  const now = /* @__PURE__ */ new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}
async function getAllWeeklyTasks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(weeklyOpsTasks).orderBy(weeklyOpsTasks.day, weeklyOpsTasks.sortOrder);
}
async function getCompletionsForWeek(weekStart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(weeklyOpsCompletions).where(eq3(weeklyOpsCompletions.weekStart, weekStart));
}
async function markTaskComplete(taskId, weekStart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(weeklyOpsCompletions).where(
    and2(
      eq3(weeklyOpsCompletions.taskId, taskId),
      eq3(weeklyOpsCompletions.weekStart, weekStart)
    )
  ).limit(1);
  if (existing.length === 0) {
    await db.insert(weeklyOpsCompletions).values({ taskId, weekStart });
  }
}
async function markTaskIncomplete(taskId, weekStart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(weeklyOpsCompletions).where(
    and2(
      eq3(weeklyOpsCompletions.taskId, taskId),
      eq3(weeklyOpsCompletions.weekStart, weekStart)
    )
  );
}

// server/focusModeDb.ts
init_db();
init_schema();
import { eq as eq4, and as and3 } from "drizzle-orm";
var SPURGEON_DEVOTIONS = [
  {
    ref: "Spurgeon \u2014 Morning, Day 1",
    text: '"Let me seek to know God better, and to make Him better known." The Christian life is not a passive existence but an active pursuit. Each morning is a fresh commission \u2014 to go deeper into the knowledge of the One who called you, and to carry that knowledge outward into every conversation, every decision, every act of courage this day demands.'
  },
  {
    ref: "Spurgeon \u2014 Morning, Day 2",
    text: '"God is too good to be unkind, too wise to be mistaken, and when you cannot trace His hand, you can always trust His heart." When the work is hard and the results invisible, remember: faithfulness is the assignment. The harvest belongs to God. Your task is to plant, water, and keep showing up.'
  },
  {
    ref: "Spurgeon \u2014 Morning, Day 3",
    text: '"It is not how much we have, but how much we enjoy, that makes happiness." The investigator who works with integrity, who pursues truth without compromise, who serves the vulnerable without expecting recognition \u2014 that person has already found what the world is searching for.'
  },
  {
    ref: "Spurgeon \u2014 Morning, Day 4",
    text: `"A Bible that is falling apart usually belongs to someone who isn't." The disciplines you build today \u2014 the routines, the habits, the daily commitments \u2014 are the architecture of a life that holds together under pressure. Do not despise small beginnings. The oak was once an acorn.`
  },
  {
    ref: "Spurgeon \u2014 Morning, Day 5",
    text: '"I have learned to kiss the wave that throws me against the Rock of Ages." Every setback in this work \u2014 every door that closes, every source that goes silent, every day the donations do not come \u2014 is not the end of the story. It is the pressure that produces the pearl.'
  },
  {
    ref: "Spurgeon \u2014 Morning, Day 6",
    text: '"Nobody ever outgrows Scripture; the book widens and deepens with our years." You are 70 years into a life that has given you something no algorithm can replicate: the wisdom of having lived through what others only theorize about. That is your edge. Use it.'
  },
  {
    ref: "Spurgeon \u2014 Morning, Day 7",
    text: '"By perseverance the snail reached the ark." Consistency over brilliance. Showing up over inspiration. The work you do today \u2014 even if it feels small \u2014 is a brick in a wall that will one day stand as evidence that someone cared enough to tell the truth when it was costly to do so.'
  }
];
var DAILY_VERSES = [
  { ref: "Psalm 118:24", text: "This is the day that the Lord has made; let us rejoice and be glad in it." },
  { ref: "Proverbs 16:3", text: "Commit your work to the Lord, and your plans will be established." },
  { ref: "Isaiah 40:31", text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles." },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
  { ref: "Philippians 4:13", text: "I can do all things through him who strengthens me." },
  { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go." },
  { ref: "Matthew 5:6", text: "Blessed are those who hunger and thirst for righteousness, for they shall be satisfied." }
];
var CLOSING_VERSES = [
  { ref: "Psalm 4:8", text: "In peace I will both lie down and sleep; for you alone, O Lord, make me dwell in safety." },
  { ref: "Lamentations 3:22-23", text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness." },
  { ref: "Psalm 121:8", text: "The Lord will keep your going out and your coming in from this time forth and forevermore." },
  { ref: "Numbers 6:24-26", text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace." },
  { ref: "2 Timothy 4:7", text: "I have fought the good fight, I have finished the race, I have kept the faith." },
  { ref: "Psalm 19:14", text: "Let the words of my mouth and the meditation of my heart be acceptable in your sight, O Lord, my rock and my redeemer." },
  { ref: "Micah 6:8", text: "He has told you, O man, what is good; and what does the Lord require of you but to do justice, and to love kindness, and to walk humbly with your God?" }
];
var BRAIN_EXERCISES = {
  memory: [
    { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**JUSTICE \xB7 ARCHIVE \xB7 SIGNAL \xB7 TRUTH \xB7 WITNESS**\n\nType them back in the correct sequence.", answer: "JUSTICE, ARCHIVE, SIGNAL, TRUTH, WITNESS" },
    { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**CIPHER \xB7 MANILA \xB7 RECORD \xB7 VAULT \xB7 EXPOSE**\n\nType them back in the correct sequence.", answer: "CIPHER, MANILA, RECORD, VAULT, EXPOSE" },
    { prompt: "Study these 5 words for 10 seconds, then recall them in order:\n\n**COURAGE \xB7 DOCUMENT \xB7 VERIFY \xB7 SOURCE \xB7 PUBLISH**\n\nType them back in the correct sequence.", answer: "COURAGE, DOCUMENT, VERIFY, SOURCE, PUBLISH" }
  ],
  pattern: [
    { prompt: "Complete the sequence \u2014 what comes next?\n\n**2, 4, 8, 16, ___**", answer: "32" },
    { prompt: "Complete the sequence \u2014 what comes next?\n\n**Monday, Wednesday, Friday, ___**", answer: "Sunday" },
    { prompt: "Complete the sequence \u2014 what comes next?\n\n**A, C, F, J, ___**\n\n*(Hint: the gaps between letters increase by 1 each time)*", answer: "O" }
  ],
  word_association: [
    { prompt: "The word is **JUSTICE**.\n\nName 5 things this word personally means to you \u2014 one per line. There are no wrong answers. This is about your own connections.", answer: "" },
    { prompt: "The word is **TRUTH**.\n\nName 5 things this word personally means to you \u2014 one per line. Think about your work, your faith, your life.", answer: "" },
    { prompt: "The word is **COURAGE**.\n\nName 5 people or moments in your life that this word brings to mind \u2014 one per line.", answer: "" }
  ],
  breathing: [
    { prompt: '## 4-7-8 Breathing \u2014 3 Rounds\n\nThis technique activates your parasympathetic nervous system, lowers cortisol, and sharpens focus.\n\n**Round 1:** Inhale through your nose for **4 counts** \u2192 Hold for **7 counts** \u2192 Exhale through your mouth for **8 counts**\n\n**Round 2:** Repeat\n\n**Round 3:** Repeat\n\nWhen you have completed all 3 rounds, type "Done" below.', answer: "Done" },
    { prompt: '## Box Breathing \u2014 4 Rounds\n\nUsed by Navy SEALs and surgeons to reset under pressure.\n\n**Each round:** Inhale for **4 counts** \u2192 Hold for **4 counts** \u2192 Exhale for **4 counts** \u2192 Hold for **4 counts**\n\nComplete 4 rounds. When finished, type "Done" below.', answer: "Done" }
  ],
  gratitude: [
    { prompt: "## Gratitude Anchor\n\nName **one specific thing** you are grateful for today \u2014 and write **one sentence** about why it matters to you.\n\nThis is private. Only you will see it. Be honest.", answer: "" },
    { prompt: "## Gratitude Anchor\n\nThink about someone who has helped your work \u2014 directly or indirectly. Name them (or describe them if you prefer privacy) and write one sentence about what they gave you.", answer: "" },
    { prompt: "## Gratitude Anchor\n\nWhat is one thing about your own character or ability that you are grateful for today? Write one honest sentence.", answer: "" }
  ]
};
async function getTodaySession(userId, sessionDate) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(focusSessions).where(and3(eq4(focusSessions.userId, userId), eq4(focusSessions.sessionDate, sessionDate))).limit(1);
  return rows[0] ?? null;
}
async function upsertFocusSession(userId, sessionDate, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getTodaySession(userId, sessionDate);
  if (existing) {
    await db.update(focusSessions).set(data).where(eq4(focusSessions.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(focusSessions).values({ userId, sessionDate, ...data });
    return result[0].insertId;
  }
}
async function logBrainExercise(sessionId, exerciseType, prompt, userResponse) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(brainExerciseLogs).values({ sessionId, exerciseType, prompt, userResponse });
}

// server/routers.ts
init_db();
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var priorWorkSchema = z2.array(z2.object({
  title: z2.string(),
  url: z2.string()
}));
var applicationSchema = z2.object({
  // Section 1: Identity
  displayName: z2.string().min(1, "Display name is required"),
  email: z2.string().email("Valid email is required"),
  profileUrl: z2.string().optional(),
  // Section 2: Organization
  organization: z2.string().optional(),
  orgRole: z2.string().optional(),
  orgWebsite: z2.string().optional(),
  // Section 3: Prior Work
  priorWork: priorWorkSchema.optional(),
  // Section 4: Investigation Purpose
  investigationProject: z2.string().min(10, "Please describe your investigation in detail"),
  geographicFocus: z2.string().min(1, "Geographic focus is required"),
  outputType: z2.string().min(1, "Expected output type is required"),
  // Section 5: Support & Attribution
  supportLink: z2.string().optional(),
  agreesToCredit: z2.boolean(),
  // Section 6: Safety & Risk
  underThreats: z2.enum(["yes", "no", "prefer_not"]).optional(),
  useOpSec: z2.boolean().optional(),
  opSecTools: z2.string().optional(),
  previouslyDoxxed: z2.enum(["yes", "no", "prefer_not"]).optional(),
  emergencyContact: z2.string().optional(),
  consentSafetyOutreach: z2.boolean().optional(),
  // Section 7: Terms
  referralSource: z2.string().optional(),
  willShareRawData: z2.boolean().optional(),
  agreesToTerms: z2.boolean().refine((v) => v === true, "You must agree to the terms of use"),
  agreesToPrivacy: z2.boolean().refine((v) => v === true, "You must agree to the privacy policy")
});
var vloggerInquiriesRouter = router({
  list: adminProcedure2.query(async () => {
    return getAllVloggerInquiries();
  }),
  update: adminProcedure2.input(z2.object({
    id: z2.number(),
    creatorName: z2.string().optional(),
    channelName: z2.string().optional(),
    platform: z2.enum(["youtube", "tiktok", "facebook", "instagram", "other"]).optional(),
    subscriberCount: z2.string().optional(),
    email: z2.string().optional(),
    evidenceTier: z2.enum(["confirmed_violation", "documented_evidence", "under_investigation"]).optional(),
    violationDate: z2.string().optional(),
    agency: z2.string().optional(),
    violationSummary: z2.string().optional(),
    startYear: z2.string().optional(),
    estimatedRevenue: z2.string().optional(),
    inquiryStatus: z2.enum(["not_sent", "sent", "responded", "no_reply", "declined"]).optional(),
    internalNotes: z2.string().optional()
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateVloggerInquiry(id, data);
    return { success: true };
  }),
  delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    await deleteVloggerInquiry(input.id);
    return { success: true };
  }),
  sendInquiry: adminProcedure2.input(z2.object({
    id: z2.number(),
    letterText: z2.string(),
    deadline: z2.string(),
    sendEmail: z2.boolean().optional().default(false)
  })).mutation(async ({ input }) => {
    const now = /* @__PURE__ */ new Date();
    const deadlineDate = new Date(input.deadline);
    const creator = await getVloggerInquiryById(input.id);
    if (!creator) throw new TRPCError3({ code: "NOT_FOUND", message: "Creator not found" });
    let emailId;
    let emailError;
    if (input.sendEmail) {
      if (!creator.email) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "No email address on file for this creator. Edit the creator row to add one first."
        });
      }
      const result = await sendVloggerInquiryEmail({
        recipientEmail: creator.email,
        creatorName: creator.creatorName,
        channelName: creator.channelName ?? creator.creatorName,
        letterText: input.letterText,
        deadline: input.deadline
      });
      if (!result.success) {
        emailError = result.error ?? "Email send failed";
      } else {
        emailId = result.emailId;
      }
    }
    await updateVloggerInquiry(input.id, {
      inquiryStatus: "sent",
      dateSent: now,
      deadline: deadlineDate,
      sentLetterText: input.letterText
    });
    return { success: true, emailId, emailError };
  }),
  create: adminProcedure2.input(z2.object({
    creatorName: z2.string(),
    channelName: z2.string().optional(),
    platform: z2.enum(["youtube", "tiktok", "facebook", "instagram", "other"]).optional(),
    subscriberCount: z2.string().optional(),
    email: z2.string().optional(),
    evidenceTier: z2.enum(["confirmed_violation", "documented_evidence", "under_investigation"]).optional()
  })).mutation(async ({ input }) => {
    return createVloggerInquiry(input);
  })
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  vetting: router({
    // Public: submit an application
    submit: publicProcedure.input(applicationSchema).mutation(async ({ input }) => {
      const insertData = {
        displayName: input.displayName,
        email: input.email,
        profileUrl: input.profileUrl ?? null,
        organization: input.organization ?? null,
        orgRole: input.orgRole ?? null,
        orgWebsite: input.orgWebsite ?? null,
        priorWork: input.priorWork ?? [],
        investigationProject: input.investigationProject,
        geographicFocus: input.geographicFocus,
        outputType: input.outputType,
        supportLink: input.supportLink ?? null,
        agreesToCredit: input.agreesToCredit ? 1 : 0,
        underThreats: input.underThreats ?? null,
        useOpSec: input.useOpSec ? 1 : 0,
        opSecTools: input.opSecTools ?? null,
        previouslyDoxxed: input.previouslyDoxxed ?? null,
        emergencyContact: input.emergencyContact ?? null,
        consentSafetyOutreach: input.consentSafetyOutreach ? 1 : 0,
        referralSource: input.referralSource ?? null,
        willShareRawData: input.willShareRawData ? 1 : 0,
        agreesToTerms: input.agreesToTerms ? 1 : 0,
        agreesToPrivacy: input.agreesToPrivacy ? 1 : 0,
        status: "pending"
      };
      const result = await createApplication(insertData);
      const insertId = result[0]?.insertId ?? result.insertId;
      if (insertId) {
        scoreApplication(insertData).then(async (score) => {
          await updateApplication(insertId, {
            aiScore: score.totalScore,
            aiScoreIdentity: score.scoreIdentity,
            aiScoreOrganization: score.scoreOrganization,
            aiScorePurpose: score.scorePurpose,
            aiScoreSupport: score.scoreSupport,
            aiScoreRisk: score.scoreRisk,
            aiRationale: score.rationale,
            aiRecommendation: score.recommendation
          });
        }).catch((err) => console.error("[Scoring] Background scoring failed:", err));
      }
      await sendSubmissionConfirmation(input.email, input.displayName).catch(() => {
      });
      return { success: true, applicationId: insertId };
    }),
    // Admin: list all applications
    list: adminProcedure2.query(async () => {
      return getAllApplications();
    }),
    // Admin: get single application
    get: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const app2 = await getApplicationById(input.id);
      if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
      return app2;
    }),
    // Admin: update status (approve/reject/needs_info)
    updateStatus: adminProcedure2.input(z2.object({
      id: z2.number(),
      status: z2.enum(["approved", "rejected", "needs_info"]),
      adminNotes: z2.string().optional(),
      assignedRole: z2.string().optional(),
      infoMessage: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const app2 = await getApplicationById(input.id);
      if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
      await updateApplication(input.id, {
        status: input.status,
        adminNotes: input.adminNotes ?? app2.adminNotes,
        assignedRole: input.assignedRole ?? app2.assignedRole,
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedBy: ctx.user.id
      });
      await notifyOwner({
        title: `Vetting Decision: ${input.status.toUpperCase()} \u2014 ${app2.displayName}`,
        content: `Application #${input.id} for ${app2.displayName} (${app2.email}) has been ${input.status}.

Role: ${input.assignedRole ?? "N/A"}
Notes: ${input.adminNotes ?? "None"}`
      }).catch(() => {
      });
      let emailId = null;
      if (input.status === "approved") {
        emailId = await sendApprovalEmail(app2.email, app2.displayName, input.assignedRole ?? "Researcher").catch(() => null);
      } else if (input.status === "rejected") {
        emailId = await sendRejectionEmail(app2.email, app2.displayName).catch(() => null);
      } else if (input.status === "needs_info") {
        const msg = input.infoMessage ?? input.adminNotes ?? "Please provide additional information about your application.";
        emailId = await sendMoreInfoEmail(app2.email, app2.displayName, msg).catch(() => null);
      }
      if (emailId) {
        await updateApplicationEmailTracking(input.id, emailId, input.status).catch(() => {
        });
      }
      if (input.status === "approved") {
        const webhookSecret = process.env.VETTING_WEBHOOK_SECRET;
        const webhookUrl = process.env.TRUTHDROP_WEBHOOK_URL || "https://truthdrop.io/api/webhook/approve";
        if (webhookSecret) {
          fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-webhook-secret": webhookSecret
            },
            body: JSON.stringify({
              email: app2.email,
              name: app2.displayName,
              organization: app2.organization ?? null,
              assignedRole: input.assignedRole ?? "observer"
            })
          }).then(async (r) => {
            if (!r.ok) {
              const txt = await r.text().catch(() => "");
              console.error(`[Webhook] truthdrop.io provisioning failed (${r.status}):`, txt);
            } else {
              console.log(`[Webhook] truthdrop.io user provisioned for ${app2.email}`);
            }
          }).catch((err) => console.error("[Webhook] truthdrop.io call failed:", err));
        } else {
          console.warn("[Webhook] VETTING_WEBHOOK_SECRET not set \u2014 skipping truthdrop.io provisioning");
        }
      }
      return { success: true };
    }),
    // Admin: update notes only
    updateNotes: adminProcedure2.input(z2.object({
      id: z2.number(),
      adminNotes: z2.string()
    })).mutation(async ({ input }) => {
      await updateApplication(input.id, { adminNotes: input.adminNotes });
      return { success: true };
    }),
    // Admin: delete application
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteApplication(input.id);
      return { success: true };
    }),
    // Admin: send invitation (supports multiple comma-separated emails)
    sendInvitation: adminProcedure2.input(z2.object({
      emails: z2.array(z2.string().email()).min(1).max(50),
      personalMessage: z2.string().optional(),
      origin: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const results = [];
      for (const email of input.emails) {
        const token = nanoid(32);
        await createInvitation(email, token, input.personalMessage ?? null, ctx.user.id);
        const inviteUrl = `${input.origin}/?invite=${token}`;
        await sendInvitationEmail(email, input.personalMessage ?? null, inviteUrl);
        results.push({ email, inviteUrl });
      }
      await notifyOwner({
        title: `\u{1F4E8} ${input.emails.length} Invitation(s) Sent`,
        content: `Invitations sent to:
${input.emails.join("\n")}`
      }).catch(() => {
      });
      return { success: true, count: input.emails.length, results };
    }),
    // Admin: re-score an application
    rescore: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const app2 = await getApplicationById(input.id);
      if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
      const score = await scoreApplication(app2);
      await updateApplication(input.id, {
        aiScore: score.totalScore,
        aiScoreIdentity: score.scoreIdentity,
        aiScoreOrganization: score.scoreOrganization,
        aiScorePurpose: score.scorePurpose,
        aiScoreSupport: score.scoreSupport,
        aiScoreRisk: score.scoreRisk,
        aiRationale: score.rationale,
        aiRecommendation: score.recommendation
      });
      return { success: true, score };
    }),
    // Admin: send re-engagement email to an inactive approved applicant
    sendReengagement: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const app2 = await getApplicationById(input.id);
      if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
      if (app2.status !== "approved") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Re-engagement emails can only be sent to approved applicants." });
      }
      const emailId = await sendReengagementEmail(
        app2.email,
        app2.displayName,
        app2.assignedRole ?? "researcher"
      );
      if (emailId) {
        await updateApplicationEmailTracking(input.id, emailId, "reengagement").catch(() => {
        });
      }
      await notifyOwner({
        title: `\u{1F4E7} Re-engagement email sent to ${app2.displayName}`,
        content: `Re-engagement notice sent to ${app2.email} (Application #${input.id}).`
      }).catch(() => {
      });
      return { success: true, emailId };
    }),
    // Admin: downgrade an approved applicant to basic user status
    downgradeToUser: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const app2 = await getApplicationById(input.id);
      if (!app2) throw new TRPCError3({ code: "NOT_FOUND" });
      await updateApplication(input.id, {
        status: "user_downgraded",
        adminNotes: (app2.adminNotes ? app2.adminNotes + "\n" : "") + `[${(/* @__PURE__ */ new Date()).toISOString()}] Downgraded to basic user due to inactivity.`
      });
      await notifyOwner({
        title: `\u{1F53D} ${app2.displayName} downgraded to user`,
        content: `Application #${input.id} for ${app2.displayName} (${app2.email}) has been downgraded to basic user status due to inactivity.`
      }).catch(() => {
      });
      return { success: true };
    })
  }),
  // ─── Public Stats ──────────────────────────────────────────────────────────
  stats: router({
    public: publicProcedure.query(async () => {
      return getPublicStats();
    }),
    activity: adminProcedure2.query(async () => {
      return getActivityStats();
    })
  }),
  // ─── Tips ────────────────────────────────────────────────────────────────
  // Security hardening:
  //   1. Raw IP is NEVER stored — only a one-way SHA-256 hash
  //   2. Pseudonym and burnerEmail are truly optional (no fallback logging)
  //   3. Confirmation response contains no identifying metadata
  //   4. File bytes go to S3 with randomized key — never stored in DB
  //   5. Tip content is accessible only to admin role
  tips: router({
    submit: publicProcedure.input(
      z2.object({
        pseudonym: z2.string().max(100).optional(),
        burnerEmail: z2.string().email().max(320).optional().or(z2.literal("")),
        category: z2.enum(["fraud", "misuse_of_funds", "false_claims", "identity", "network", "other"]),
        subject: z2.string().min(5).max(500),
        message: z2.string().min(20).max(1e4),
        // File upload: base64-encoded content + metadata (max 10 MB enforced client-side)
        fileBase64: z2.string().optional(),
        fileName: z2.string().max(255).optional(),
        fileMime: z2.string().max(100).optional(),
        // Client passes its own IP hash (server will re-hash for safety)
        clientIpHint: z2.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const rawIp = ctx.req?.headers?.["x-forwarded-for"] || ctx.req?.socket?.remoteAddress || "unknown";
      const ipHash = createHash("sha256").update(String(rawIp)).digest("hex");
      let fileUrl;
      let fileKey;
      let safeFileName;
      if (input.fileBase64 && input.fileName && input.fileMime) {
        const suffix = randomBytes(8).toString("hex");
        const ext = input.fileName.split(".").pop() ?? "bin";
        safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        fileKey = `tips/${suffix}-${safeFileName}`;
        const buffer = Buffer.from(input.fileBase64, "base64");
        const stored = await storagePut(fileKey, buffer, input.fileMime);
        fileUrl = stored.url;
        fileKey = stored.key;
      }
      await createTip({
        pseudonym: input.pseudonym || null,
        burnerEmail: input.burnerEmail || null,
        category: input.category,
        subject: input.subject,
        message: input.message,
        fileUrl: fileUrl ?? null,
        fileKey: fileKey ?? null,
        fileName: safeFileName ?? null,
        ipHash
      });
      await notifyOwner({
        title: "New confidential tip received",
        content: `Category: ${input.category}. Subject: ${input.subject.slice(0, 80)}. Review in admin panel.`
      }).catch(() => {
      });
      return { success: true, message: "Your tip has been received securely." };
    }),
    // ADMIN ONLY: list all tips
    list: adminProcedure2.query(async () => {
      return getAllTips();
    }),
    // ADMIN ONLY: get a single tip
    get: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const tip = await getTipById(input.id);
      if (!tip) throw new TRPCError3({ code: "NOT_FOUND", message: "Tip not found" });
      return tip;
    }),
    // ADMIN ONLY: update status, priority, admin notes
    updateStatus: adminProcedure2.input(
      z2.object({
        id: z2.number(),
        status: z2.enum(["new", "reviewing", "actioned", "closed"]).optional(),
        priority: z2.enum(["low", "medium", "high"]).optional(),
        adminNotes: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTip(id, data);
      return { success: true };
    }),
    // ADMIN ONLY: permanently delete a tip
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteTip(input.id);
      return { success: true };
    })
  }),
  // ── PDF Export (chain-of-custody watermarking) ──────────────────────────────────────
  pdf: router({
    /**
     * Export a case as a watermarked PDF.
     * Requires authentication (any logged-in user).
     * Generates a unique document ID, stamps all 4 watermark fields,
     * uploads to S3, and logs the export to export_logs (admin-only).
     */
    exportCase: protectedProcedure.input(
      z2.object({
        caseId: z2.string().min(1),
        caseTitle: z2.string().optional(),
        contentLines: z2.array(z2.string()),
        researcherAlias: z2.string().min(1)
      })
    ).mutation(async ({ input, ctx }) => {
      const documentId = uuidv4();
      const exportedAt = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19) + " UTC";
      const watermarkOpts = {
        researcherAlias: input.researcherAlias,
        documentId,
        exportedAt
      };
      const pdfBytes = await createTextPdf(
        input.caseTitle ?? input.caseId,
        input.contentLines,
        watermarkOpts
      );
      const randomSuffix = randomBytes(8).toString("hex");
      const fileKey = `exports/${ctx.user.id}-${input.caseId}-${randomSuffix}.pdf`;
      const { url: fileUrl } = await storagePut(fileKey, Buffer.from(pdfBytes), "application/pdf");
      await createExportLog({
        researcherId: ctx.user.id,
        researcherAlias: input.researcherAlias,
        caseId: input.caseId,
        caseTitle: input.caseTitle,
        documentId,
        fileUrl,
        fileKey
      });
      return {
        success: true,
        documentId,
        fileUrl,
        exportedAt
      };
    }),
    /**
     * Admin-only: list all export log entries.
     * Chain of custody audit trail.
     */
    listExportLogs: adminProcedure2.query(async () => {
      return getAllExportLogs();
    })
  }),
  // ── Volunteer Program ───────────────────────────────────────────────────────
  volunteer: router({
    submit: publicProcedure.input(
      z2.object({
        fullName: z2.string().min(1).max(255),
        email: z2.string().email(),
        age: z2.number().int().min(15).max(20),
        schoolName: z2.string().min(1).max(255),
        gradeLevel: z2.string().min(1).max(50),
        strand: z2.string().max(100).optional(),
        city: z2.string().min(1).max(100),
        role: z2.enum(["osint_research_trainee", "data_verification_trainee", "digital_journalism_apprentice"]),
        teacherName: z2.string().min(1).max(255),
        teacherEmail: z2.string().email(),
        teacherSubject: z2.string().max(100).optional(),
        whyApply: z2.string().min(50),
        relevantExperience: z2.string().optional(),
        availabilityHoursPerWeek: z2.number().int().min(2).max(10),
        parentalConsentGiven: z2.number().int().min(0).max(1),
        parentName: z2.string().max(255).optional(),
        parentEmail: z2.string().email().optional(),
        agreesToTerms: z2.number().int().min(1).max(1),
        agreesToConfidentiality: z2.number().int().min(1).max(1)
      })
    ).mutation(async ({ input, ctx }) => {
      const rawIp = ctx?.req?.ip ?? ctx?.req?.headers?.["x-forwarded-for"] ?? "";
      const ipHash = rawIp ? createHash("sha256").update(String(rawIp)).digest("hex") : void 0;
      let aiScore = 5;
      let aiScoreMotivation = 2;
      let aiScoreReliability = 1;
      let aiScoreSkillFit = 1;
      let aiScoreAvailability = 1;
      let aiRationale = "Pending manual review.";
      let aiRecommendation = "review";
      try {
        const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
        const prompt = `You are reviewing a high school student volunteer application for an investigative journalism program.
Applicant: ${input.fullName}, Age ${input.age}, Grade ${input.gradeLevel} at ${input.schoolName} in ${input.city}.
Role applied for: ${input.role.replace(/_/g, " ")}.
Availability: ${input.availabilityHoursPerWeek} hours/week.
Why they want to join: ${input.whyApply}
Relevant experience: ${input.relevantExperience ?? "None provided"}
Teacher recommender: ${input.teacherName} (${input.teacherEmail})
Parental consent: ${input.parentalConsentGiven ? "Yes" : "No"}

Score this application on 4 dimensions:
1. MOTIVATION (0-3): How genuine and specific is their reason for applying?
2. RELIABILITY (0-3): Does their profile suggest they will follow through?
3. SKILL FIT (0-2): Does their experience/strand match the role?
4. AVAILABILITY (0-2): Is their stated availability realistic?

Respond with valid JSON only:
{"scoreMotivation": <0-3>, "scoreReliability": <0-3>, "scoreSkillFit": <0-2>, "scoreAvailability": <0-2>, "rationale": "<2 sentence summary>", "recommendation": "<approve|review|deny>"}`;
        const response = await invokeLLM2({
          messages: [
            { role: "system", content: "You are a volunteer program coordinator. Respond with valid JSON only." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "volunteer_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  scoreMotivation: { type: "integer" },
                  scoreReliability: { type: "integer" },
                  scoreSkillFit: { type: "integer" },
                  scoreAvailability: { type: "integer" },
                  rationale: { type: "string" },
                  recommendation: { type: "string", enum: ["approve", "review", "deny"] }
                },
                required: ["scoreMotivation", "scoreReliability", "scoreSkillFit", "scoreAvailability", "rationale", "recommendation"],
                additionalProperties: false
              }
            }
          }
        });
        const rawContent = response.choices?.[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent));
          aiScoreMotivation = Math.min(3, Math.max(0, parsed.scoreMotivation));
          aiScoreReliability = Math.min(3, Math.max(0, parsed.scoreReliability));
          aiScoreSkillFit = Math.min(2, Math.max(0, parsed.scoreSkillFit));
          aiScoreAvailability = Math.min(2, Math.max(0, parsed.scoreAvailability));
          aiScore = aiScoreMotivation + aiScoreReliability + aiScoreSkillFit + aiScoreAvailability;
          aiRationale = parsed.rationale;
          aiRecommendation = aiScore >= 7 ? "approve" : aiScore >= 4 ? "review" : "deny";
        }
      } catch (e) {
        console.error("[Volunteer] AI scoring failed:", e);
      }
      await createVolunteerApplication({
        fullName: input.fullName,
        email: input.email,
        age: input.age,
        schoolName: input.schoolName,
        gradeLevel: input.gradeLevel,
        strand: input.strand,
        city: input.city,
        role: input.role,
        teacherName: input.teacherName,
        teacherEmail: input.teacherEmail,
        teacherSubject: input.teacherSubject,
        whyApply: input.whyApply,
        relevantExperience: input.relevantExperience,
        availabilityHoursPerWeek: input.availabilityHoursPerWeek,
        parentalConsentGiven: input.parentalConsentGiven,
        parentName: input.parentName,
        parentEmail: input.parentEmail,
        agreesToTerms: input.agreesToTerms,
        agreesToConfidentiality: input.agreesToConfidentiality,
        aiScore,
        aiScoreMotivation,
        aiScoreReliability,
        aiScoreSkillFit,
        aiScoreAvailability,
        aiRationale,
        aiRecommendation,
        ipHash,
        status: "pending"
      });
      await notifyOwner({
        title: `New Volunteer Application \u2014 ${input.fullName}`,
        content: `Role: ${input.role.replace(/_/g, " ")} | School: ${input.schoolName}, ${input.city} | AI Score: ${aiScore}/10 (${aiRecommendation})`
      }).catch(() => {
      });
      sendTeacherConfirmationEmail(
        input.teacherEmail,
        input.teacherName,
        input.fullName,
        input.schoolName,
        input.role,
        input.city
      ).catch(() => {
      });
      sendVolunteerConfirmationEmail(
        input.email,
        input.fullName,
        input.role,
        input.schoolName,
        input.teacherName,
        input.parentalConsentGiven === 1
      ).catch(() => {
      });
      return { success: true };
    }),
    list: adminProcedure2.query(async () => {
      return getAllVolunteerApplications();
    }),
    getById: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getVolunteerApplicationById(input.id);
    }),
    updateStatus: adminProcedure2.input(
      z2.object({
        id: z2.number(),
        status: z2.enum(["pending", "approved", "rejected", "needs_info"]),
        adminNotes: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const vol = await getVolunteerApplicationById(input.id);
      if (!vol) throw new TRPCError3({ code: "NOT_FOUND" });
      await updateVolunteerApplication(input.id, {
        status: input.status,
        adminNotes: input.adminNotes
      });
      if (input.status === "approved") {
        sendVolunteerApprovalEmail(vol.email, vol.fullName, vol.role ?? "").catch(() => {
        });
      } else if (input.status === "rejected") {
        sendVolunteerRejectionEmail(vol.email, vol.fullName).catch(() => {
        });
      }
      return { success: true };
    }),
    updateHours: adminProcedure2.input(
      z2.object({
        id: z2.number(),
        hoursCompleted: z2.number().int().min(0),
        contributionSummary: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      await updateVolunteerApplication(input.id, {
        hoursCompleted: input.hoursCompleted,
        contributionSummary: input.contributionSummary
      });
      return { success: true };
    }),
    generateCertificate: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const vol = await getVolunteerApplicationById(input.id);
      if (!vol) throw new TRPCError3({ code: "NOT_FOUND" });
      if (vol.status !== "approved") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Volunteer must be approved before generating a certificate." });
      }
      const { url, docId } = await generateVolunteerCertificate(input.id);
      return { url, docId, filename: `certificate-${vol.fullName.replace(/\s+/g, "-")}.pdf` };
    }),
    verifyCertificate: publicProcedure.input(z2.object({ docId: z2.string().min(1) })).query(async ({ input }) => {
      const vol = await getVolunteerByDocId(input.docId.trim().toUpperCase());
      if (!vol || !vol.certificateDocId) {
        return { valid: false, data: null };
      }
      return {
        valid: true,
        data: {
          docId: vol.certificateDocId,
          studentName: vol.fullName,
          role: vol.role,
          schoolName: vol.schoolName,
          city: vol.city,
          hoursCompleted: vol.hoursCompleted ?? 0,
          issuedAt: vol.certificateIssuedAt ? vol.certificateIssuedAt.toISOString() : null,
          certificateUrl: vol.certificateFileUrl
        }
      };
    }),
    generateProgramDoc: publicProcedure.input(z2.object({
      docType: z2.enum(["consent_form", "confidentiality_agreement", "sample_research_task", "program_summary", "release_of_liability"])
    })).mutation(async ({ input }) => {
      const { url, docId } = await generateProgramDocument(input.docType);
      return { url, docId };
    })
  }),
  // ─── School Contacts (Manila Principals) ───────────────────────────────────
  schoolContacts: router({
    list: adminProcedure2.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { desc: desc2 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) return [];
      const rows = await db.select().from(schoolContacts2).orderBy(desc2(schoolContacts2.createdAt));
      return rows;
    }),
    add: adminProcedure2.input(z2.object({
      principalName: z2.string().min(1),
      schoolName: z2.string().min(1),
      district: z2.string().min(1),
      email: z2.string().email(),
      phone: z2.string().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(schoolContacts2).values({
        principalName: input.principalName,
        schoolName: input.schoolName,
        district: input.district,
        email: input.email,
        phone: input.phone ?? null,
        notes: input.notes ?? null
      });
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(schoolContacts2).where(eq5(schoolContacts2.id, input.id));
      return { success: true };
    }),
    updateStatus: adminProcedure2.input(z2.object({
      id: z2.number(),
      status: z2.enum(["not_sent", "sent", "responded", "no_reply", "meeting"])
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(schoolContacts2).set({ status: input.status }).where(eq5(schoolContacts2.id, input.id));
      return { success: true };
    }),
    sendFellowshipEmail: adminProcedure2.input(z2.object({
      id: z2.number(),
      lang: z2.enum(["en", "tl"]).default("en")
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      const [contact] = await db.select().from(schoolContacts2).where(eq5(schoolContacts2.id, input.id));
      if (!contact) throw new TRPCError3({ code: "NOT_FOUND" });
      const result = await sendPrincipalFellowshipEmail(
        contact.email,
        contact.principalName,
        contact.schoolName,
        contact.district,
        input.lang
      );
      if (result.success) {
        const followUpDate = /* @__PURE__ */ new Date();
        followUpDate.setDate(followUpDate.getDate() + 7);
        await db.update(schoolContacts2).set({ status: "sent", lastEmailedAt: /* @__PURE__ */ new Date(), followUpDate }).where(eq5(schoolContacts2.id, input.id));
      }
      return result;
    }),
    // Bulk send fellowship email to multiple contacts
    sendBulkFellowshipEmail: adminProcedure2.input(z2.object({
      ids: z2.array(z2.number()).min(1).max(100),
      skipAlreadySent: z2.boolean().default(true),
      lang: z2.enum(["en", "tl"]).default("en")
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5, inArray } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      const contacts = await db.select().from(schoolContacts2).where(inArray(schoolContacts2.id, input.ids));
      const results = [];
      for (const contact of contacts) {
        if (input.skipAlreadySent && contact.status === "sent") {
          results.push({
            id: contact.id,
            name: contact.principalName,
            school: contact.schoolName,
            email: contact.email,
            success: false,
            skipped: true
          });
          continue;
        }
        try {
          const result = await sendPrincipalFellowshipEmail(
            contact.email,
            contact.principalName,
            contact.schoolName,
            contact.district,
            input.lang
          );
          if (result.success) {
            const bulkFollowUpDate = /* @__PURE__ */ new Date();
            bulkFollowUpDate.setDate(bulkFollowUpDate.getDate() + 7);
            await db.update(schoolContacts2).set({ status: "sent", lastEmailedAt: /* @__PURE__ */ new Date(), followUpDate: bulkFollowUpDate }).where(eq5(schoolContacts2.id, contact.id));
          }
          results.push({
            id: contact.id,
            name: contact.principalName,
            school: contact.schoolName,
            email: contact.email,
            success: result.success,
            skipped: false,
            error: result.success ? void 0 : "Resend delivery failed"
          });
        } catch (err) {
          results.push({
            id: contact.id,
            name: contact.principalName,
            school: contact.schoolName,
            email: contact.email,
            success: false,
            skipped: false,
            error: err?.message ?? "Unknown error"
          });
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      const sent = results.filter((r) => r.success).length;
      const skipped = results.filter((r) => r.skipped).length;
      const failed = results.filter((r) => !r.success && !r.skipped).length;
      return { results, sent, skipped, failed };
    }),
    // Update sendFellowshipEmail to also set a 7-day follow-up date
    setFollowUpDate: adminProcedure2.input(z2.object({ id: z2.number(), followUpDate: z2.string() })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(schoolContacts2).set({ followUpDate: new Date(input.followUpDate) }).where(eq5(schoolContacts2.id, input.id));
      return { success: true };
    }),
    sendFollowUpEmail: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      const [contact] = await db.select().from(schoolContacts2).where(eq5(schoolContacts2.id, input.id));
      if (!contact) throw new TRPCError3({ code: "NOT_FOUND" });
      const result = await sendFollowUpFellowshipEmail(
        contact.email,
        contact.principalName,
        contact.schoolName,
        contact.district
      );
      if (result.success) {
        await db.update(schoolContacts2).set({ followUpSent: true, followUpSentAt: /* @__PURE__ */ new Date(), status: "sent" }).where(eq5(schoolContacts2.id, input.id));
      }
      return result;
    }),
    logReply: adminProcedure2.input(z2.object({
      id: z2.number(),
      status: z2.enum(["responded", "no_reply", "meeting"]),
      replyNotes: z2.string().max(1e3).optional()
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      const [contact] = await db.select().from(schoolContacts2).where(eq5(schoolContacts2.id, input.id));
      await db.update(schoolContacts2).set({
        status: input.status,
        replyNotes: input.replyNotes ?? null,
        replyReceivedAt: /* @__PURE__ */ new Date()
      }).where(eq5(schoolContacts2.id, input.id));
      if (contact) {
        const statusLabel = input.status === "meeting" ? "Meeting Set" : input.status === "responded" ? "Responded" : "No Reply";
        await notifyOwner({
          title: `\u{1F4E9} Reply Logged: ${contact.principalName} \u2014 ${contact.schoolName} (${statusLabel})`,
          content: `Status updated to: ${statusLabel}

Contact: ${contact.principalName}, ${contact.schoolName}, ${contact.district}
Email: ${contact.email}

Notes: ${input.replyNotes ?? "(none)"}`
        }).catch(() => {
        });
      }
      return { success: true };
    }),
    sendFinalNudge: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const { sendFinalNudgeFellowshipEmail: sendFinalNudgeFellowshipEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      const [contact] = await db.select().from(schoolContacts2).where(eq5(schoolContacts2.id, input.id));
      if (!contact) throw new TRPCError3({ code: "NOT_FOUND" });
      const result = await sendFinalNudgeFellowshipEmail2(
        contact.email,
        contact.principalName,
        contact.schoolName,
        contact.district
      );
      if (result.success) {
        await db.update(schoolContacts2).set({ finalNudgeSent: true, finalNudgeSentAt: /* @__PURE__ */ new Date() }).where(eq5(schoolContacts2.id, input.id));
      }
      return result;
    }),
    updateNotes: adminProcedure2.input(z2.object({
      id: z2.number(),
      internalNotes: z2.string().max(2e3)
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq5 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(schoolContacts2).set({ internalNotes: input.internalNotes }).where(eq5(schoolContacts2.id, input.id));
      return { success: true };
    })
  }),
  // ─── Media Outreach — Send via Resend ──────────────────────────────────────
  outreach: router({
    // Search DepEd school directory
    searchSchools: adminProcedure2.input(z2.object({ query: z2.string().min(2).max(100) })).query(({ input }) => {
      const { searchSchools: search } = (init_depedSchoolDirectory(), __toCommonJS(depedSchoolDirectory_exports));
      return search(input.query);
    }),
    // Get persisted media outreach statuses from DB
    getMediaStatuses: adminProcedure2.query(async () => {
      return getMediaOutreachStatuses();
    }),
    // Update media outreach status manually (status dropdown change)
    updateMediaStatus: adminProcedure2.input(z2.object({
      contactNum: z2.number(),
      status: z2.enum(["not_sent", "sent", "responded", "no_reply", "meeting"]),
      responseNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      await upsertMediaOutreachStatus(input.contactNum, input.status, void 0, input.responseNotes);
      return { success: true };
    }),
    sendPressRelease: adminProcedure2.input(z2.object({
      contactNum: z2.number(),
      recipientEmail: z2.string().email(),
      contactName: z2.string(),
      orgName: z2.string(),
      subject: z2.string(),
      personalNote: z2.string()
    })).mutation(async ({ input }) => {
      const result = await sendPressReleaseEmail(
        input.recipientEmail,
        input.contactName,
        input.orgName,
        input.subject,
        input.personalNote
      );
      await upsertMediaOutreachStatus(input.contactNum, "sent", /* @__PURE__ */ new Date());
      return result;
    })
  }),
  // ─── Weekly Ops ──────────────────────────────────────────────────────────────
  weeklyOps: router({
    getTasks: adminProcedure2.query(async () => {
      const weekStart = getCurrentWeekStart();
      const tasks = await getAllWeeklyTasks();
      const completions = await getCompletionsForWeek(weekStart);
      const completedIds = new Set(completions.map((c) => c.taskId));
      return {
        weekStart,
        tasks: tasks.map((t2) => ({ ...t2, completed: completedIds.has(t2.id) }))
      };
    }),
    toggleTask: adminProcedure2.input(z2.object({ taskId: z2.number(), completed: z2.boolean() })).mutation(async ({ input }) => {
      const weekStart = getCurrentWeekStart();
      if (input.completed) {
        await markTaskComplete(input.taskId, weekStart);
      } else {
        await markTaskIncomplete(input.taskId, weekStart);
      }
      return { success: true, weekStart };
    }),
    getProgress: adminProcedure2.query(async () => {
      const weekStart = getCurrentWeekStart();
      const tasks = await getAllWeeklyTasks();
      const completions = await getCompletionsForWeek(weekStart);
      const completedIds = new Set(completions.map((c) => c.taskId));
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      const byDay = days.map((day) => {
        const dayTasks = tasks.filter((t2) => t2.day === day);
        const done2 = dayTasks.filter((t2) => completedIds.has(t2.id)).length;
        return { day, total: dayTasks.length, done: done2 };
      });
      const total = tasks.length;
      const done = completions.length;
      return { weekStart, total, done, byDay };
    })
  }),
  focusMode: router({
    getOrCreateSession: adminProcedure2.query(async ({ ctx }) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const dayOfWeek = (/* @__PURE__ */ new Date()).getDay();
      const spurgeonIdx = dayOfWeek % SPURGEON_DEVOTIONS.length;
      const verseIdx = dayOfWeek % DAILY_VERSES.length;
      const closingIdx = (dayOfWeek + 3) % CLOSING_VERSES.length;
      const session = await getTodaySession(ctx.user.id, today);
      return {
        session,
        todayVerse: DAILY_VERSES[verseIdx],
        spurgeon: SPURGEON_DEVOTIONS[spurgeonIdx],
        closingVerse: CLOSING_VERSES[closingIdx],
        today
      };
    }),
    completeDevotion: adminProcedure2.input(z2.object({
      devotionReflection: z2.string().min(1),
      prayerText: z2.string().min(1),
      devotionVerseRef: z2.string(),
      devotionVerseText: z2.string()
    })).mutation(async ({ ctx, input }) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const sessionId = await upsertFocusSession(ctx.user.id, today, {
        devotionVerseRef: input.devotionVerseRef,
        devotionVerseText: input.devotionVerseText,
        devotionReflection: input.devotionReflection,
        prayerText: input.prayerText,
        devotionCompletedAt: /* @__PURE__ */ new Date(),
        sessionStartedAt: /* @__PURE__ */ new Date()
      });
      return { success: true, sessionId };
    }),
    logBrainExercise: adminProcedure2.input(z2.object({
      sessionId: z2.number(),
      exerciseType: z2.enum(["memory", "pattern", "word_association", "breathing", "gratitude"]),
      prompt: z2.string(),
      userResponse: z2.string()
    })).mutation(async ({ input }) => {
      await logBrainExercise(input.sessionId, input.exerciseType, input.prompt, input.userResponse);
      return { success: true };
    }),
    endSession: adminProcedure2.input(z2.object({
      sessionId: z2.number(),
      endOfDayAnswer: z2.string(),
      closingVerseRef: z2.string(),
      closingVerseText: z2.string(),
      totalMinutes: z2.number()
    })).mutation(async ({ input }) => {
      const db2 = await getDb();
      if (db2) {
        const { focusSessions: fs } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const { eq: eqOp } = await import("drizzle-orm");
        await db2.update(fs).set({
          sessionEndedAt: /* @__PURE__ */ new Date(),
          endOfDayAnswer: input.endOfDayAnswer,
          closingVerseRef: input.closingVerseRef,
          closingVerseText: input.closingVerseText,
          totalMinutes: input.totalMinutes
        }).where(eqOp(fs.id, input.sessionId));
      }
      return { success: true };
    }),
    getBrainExercise: adminProcedure2.input(z2.object({ exerciseType: z2.enum(["memory", "pattern", "word_association", "breathing", "gratitude"]) })).query(({ input }) => {
      const pool = BRAIN_EXERCISES[input.exerciseType];
      const idx = Math.floor(Math.random() * pool.length);
      return pool[idx];
    })
  }),
  // ── Researcher Portal ───────────────────────────────────────────────────────────────
  researcher: router({
    // Bookmarks
    getBookmarks: protectedProcedure.query(async ({ ctx }) => {
      return getBookmarks(ctx.user.id);
    }),
    addBookmark: protectedProcedure.input(z2.object({ caseId: z2.string().min(1), caseTitle: z2.string().optional() })).mutation(async ({ ctx, input }) => {
      return addBookmark(ctx.user.id, input.caseId, input.caseTitle);
    }),
    removeBookmark: protectedProcedure.input(z2.object({ caseId: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
      return removeBookmark(ctx.user.id, input.caseId);
    }),
    // Notes
    getNote: protectedProcedure.input(z2.object({ caseId: z2.string().min(1) })).query(async ({ ctx, input }) => {
      return getNoteForCase(ctx.user.id, input.caseId);
    }),
    saveNote: protectedProcedure.input(z2.object({ caseId: z2.string().min(1), note: z2.string() })).mutation(async ({ ctx, input }) => {
      return upsertNote(ctx.user.id, input.caseId, input.note);
    }),
    // Projects
    getProjects: protectedProcedure.query(async ({ ctx }) => {
      return getProjects(ctx.user.id);
    }),
    createProject: protectedProcedure.input(z2.object({ title: z2.string().min(1).max(255), description: z2.string().optional() })).mutation(async ({ ctx, input }) => {
      return createProject(ctx.user.id, input.title, input.description);
    }),
    updateProjectCases: protectedProcedure.input(z2.object({ projectId: z2.number().int(), caseIds: z2.array(z2.string()) })).mutation(async ({ ctx, input }) => {
      return updateProjectCases(input.projectId, ctx.user.id, input.caseIds);
    }),
    deleteProject: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).mutation(async ({ ctx, input }) => {
      return deleteProject(input.projectId, ctx.user.id);
    }),
    // Recently Viewed
    recordView: protectedProcedure.input(z2.object({ caseId: z2.string().min(1), caseTitle: z2.string().optional() })).mutation(async ({ ctx, input }) => {
      await recordRecentlyViewed(ctx.user.id, input.caseId, input.caseTitle);
      return { success: true };
    }),
    getRecentlyViewed: protectedProcedure.query(async ({ ctx }) => {
      return getRecentlyViewed(ctx.user.id);
    }),
    // Profile
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().min(1).max(255).optional(),
      organization: z2.string().max(255).optional(),
      geographicFocus: z2.string().max(500).optional(),
      subjectMatterExpertise: z2.string().max(500).optional()
    })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb();
      if (!db2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { users: usersTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqOp } = await import("drizzle-orm");
      const updateData = {};
      if (input.name !== void 0) updateData.name = input.name;
      if (Object.keys(updateData).length > 0) {
        await db2.update(usersTable).set(updateData).where(eqOp(usersTable.id, ctx.user.id));
      }
      const { vettingApplications: vettingApplications2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const apps = await db2.select().from(vettingApplications2).where(eqOp(vettingApplications2.email, ctx.user.email ?? "")).limit(1);
      if (apps.length > 0) {
        const appUpdate = {};
        if (input.organization !== void 0) appUpdate.organization = input.organization;
        if (input.geographicFocus !== void 0) appUpdate.geographicFocus = input.geographicFocus;
        if (input.subjectMatterExpertise !== void 0) appUpdate.subjectMatterExpertise = input.subjectMatterExpertise;
        if (Object.keys(appUpdate).length > 0) {
          await db2.update(vettingApplications2).set(appUpdate).where(eqOp(vettingApplications2.id, apps[0].id));
        }
      }
      return { success: true };
    })
  }),
  // ── Research Calendar ────────────────────────────────────────────────────────
  calendar: router({
    getEvents: protectedProcedure.input(z2.object({
      year: z2.number().int(),
      month: z2.number().int().min(1).max(12)
    })).query(async ({ ctx, input }) => {
      const db2 = await getDb();
      if (!db2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { researchEvents: researchEvents2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { and: and4, eq: eqOp, lte, gte } = await import("drizzle-orm");
      const monthStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const monthEnd = `${input.year}-${String(input.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const events = await db2.select().from(researchEvents2).where(
        and4(
          eqOp(researchEvents2.userId, ctx.user.id),
          lte(researchEvents2.startDate, monthEnd),
          gte(researchEvents2.endDate, monthStart)
        )
      ).orderBy(researchEvents2.startDate);
      return events;
    }),
    createEvent: protectedProcedure.input(z2.object({
      title: z2.string().min(1).max(255),
      description: z2.string().max(2e3).optional(),
      category: z2.enum(["investigation", "interview", "deadline", "outreach", "review", "personal", "other"]).default("other"),
      startDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z2.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z2.string().regex(/^\d{2}:\d{2}$/).optional(),
      allDay: z2.boolean().default(true),
      caseRef: z2.string().max(255).optional()
    })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb();
      if (!db2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { researchEvents: researchEvents2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const result = await db2.insert(researchEvents2).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        startDate: input.startDate,
        endDate: input.endDate,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        allDay: input.allDay ? 1 : 0,
        caseRef: input.caseRef ?? null,
        completed: 0
      });
      return { id: Number(result.insertId), success: true };
    }),
    updateEvent: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      title: z2.string().min(1).max(255).optional(),
      description: z2.string().max(2e3).optional(),
      category: z2.enum(["investigation", "interview", "deadline", "outreach", "review", "personal", "other"]).optional(),
      startDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      startTime: z2.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      endTime: z2.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      allDay: z2.boolean().optional(),
      caseRef: z2.string().max(255).nullable().optional(),
      completed: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb();
      if (!db2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { researchEvents: researchEvents2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { and: and4, eq: eqOp } = await import("drizzle-orm");
      const updateData = {};
      if (input.title !== void 0) updateData.title = input.title;
      if (input.description !== void 0) updateData.description = input.description;
      if (input.category !== void 0) updateData.category = input.category;
      if (input.startDate !== void 0) updateData.startDate = input.startDate;
      if (input.endDate !== void 0) updateData.endDate = input.endDate;
      if (input.startTime !== void 0) updateData.startTime = input.startTime;
      if (input.endTime !== void 0) updateData.endTime = input.endTime;
      if (input.allDay !== void 0) updateData.allDay = input.allDay ? 1 : 0;
      if (input.caseRef !== void 0) updateData.caseRef = input.caseRef;
      if (input.completed !== void 0) updateData.completed = input.completed ? 1 : 0;
      if (Object.keys(updateData).length === 0) return { success: true };
      await db2.update(researchEvents2).set(updateData).where(and4(eqOp(researchEvents2.id, input.id), eqOp(researchEvents2.userId, ctx.user.id)));
      return { success: true };
    }),
    deleteEvent: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ ctx, input }) => {
      const db2 = await getDb();
      if (!db2) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { researchEvents: researchEvents2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { and: and4, eq: eqOp } = await import("drizzle-orm");
      await db2.delete(researchEvents2).where(and4(eqOp(researchEvents2.id, input.id), eqOp(researchEvents2.userId, ctx.user.id)));
      return { success: true };
    })
  }),
  donors: router({
    list: adminProcedure2.query(async () => {
      return await getDonorContacts();
    }),
    create: adminProcedure2.input(z2.object({
      name: z2.string().min(1),
      email: z2.string().email().optional().or(z2.literal("")),
      platform: z2.enum(["kofi", "buymeacoffee", "grant", "individual", "other"]),
      tier: z2.string().optional(),
      country: z2.string().optional(),
      notes: z2.string().optional(),
      internalNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      return await createDonorContact({
        name: input.name,
        email: input.email || void 0,
        platform: input.platform,
        tier: input.tier || void 0,
        internalNotes: input.internalNotes || input.notes || void 0
      });
    }),
    update: adminProcedure2.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      email: z2.string().optional(),
      platform: z2.enum(["kofi", "buymeacoffee", "grant", "individual", "other"]).optional(),
      tier: z2.string().optional(),
      country: z2.string().optional(),
      status: z2.enum(["new", "thanked", "follow_up_sent", "responded", "declined", "no_reply"]).optional(),
      notes: z2.string().optional(),
      internalNotes: z2.string().optional(),
      followUpDate: z2.number().optional(),
      replyNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData = {};
      if (data.name !== void 0) updateData.name = data.name;
      if (data.email !== void 0) updateData.email = data.email;
      if (data.platform !== void 0) updateData.platform = data.platform;
      if (data.tier !== void 0) updateData.tier = data.tier;
      if (data.status !== void 0) {
        updateData.status = data.status;
        if (data.status === "thanked" || data.status === "follow_up_sent") {
          updateData.lastContactedAt = /* @__PURE__ */ new Date();
        }
      }
      if (data.notes !== void 0) updateData.notes = data.notes;
      if (data.internalNotes !== void 0) updateData.internalNotes = data.internalNotes;
      if (data.followUpDate !== void 0) updateData.followUpDate = data.followUpDate;
      if (data.replyNotes !== void 0) {
        updateData.replyNotes = data.replyNotes;
        updateData.replyReceivedAt = Date.now();
      }
      await updateDonorContact(id, updateData);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteDonorContact(input.id);
      return { success: true };
    }),
    logReply: adminProcedure2.input(z2.object({
      id: z2.number().int(),
      status: z2.enum(["responded", "declined", "no_reply"]),
      replyNotes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const donor = await getDonorContactById(input.id);
      await updateDonorContact(input.id, {
        status: input.status,
        replyNotes: input.replyNotes || null,
        replyReceivedAt: Date.now()
      });
      if (donor) {
        await notifyOwner({
          title: `Donor Reply: ${donor.name}`,
          content: `${donor.name} (${donor.platform?.toUpperCase()}) replied.
Status: ${input.status}
Notes: ${input.replyNotes || "(none)"}`
        });
      }
      return { success: true };
    }),
    setFollowUpDate: adminProcedure2.input(z2.object({
      id: z2.number().int(),
      followUpDate: z2.number()
    })).mutation(async ({ input }) => {
      await updateDonorContact(input.id, { followUpDate: input.followUpDate });
      return { success: true };
    })
  }),
  campaigns: router({
    summary: adminProcedure2.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb2();
      const [schoolRows, mediaStatuses, donorRows] = await Promise.all([
        db ? db.select().from(schoolContacts2) : [],
        getMediaOutreachStatuses(),
        getDonorContacts()
      ]);
      const school = schoolRows;
      const media = mediaStatuses;
      const donors = donorRows;
      const now = Date.now();
      const schoolTotal = school.length;
      const schoolEmailed = school.filter((r) => r.emailSent).length;
      const schoolFollowUpSent = school.filter((r) => r.followUpSent).length;
      const schoolFinalNudge = school.filter((r) => r.finalNudgeSent).length;
      const schoolResponded = school.filter((r) => r.schoolOutreachStatus === "responded" || r.schoolOutreachStatus === "meeting_set").length;
      const schoolOverdue = school.filter((r) => r.followUpDate && !r.followUpSent && r.followUpDate < now).length;
      const schoolDueSoon = school.filter((r) => r.followUpDate && !r.followUpSent && r.followUpDate >= now && r.followUpDate <= now + 2 * 24 * 60 * 60 * 1e3).length;
      const mediaTotal = 10;
      const mediaSent = media.filter((s) => s.status && s.status !== "Not Sent").length;
      const mediaResponded = media.filter((s) => s.status === "responded" || s.status === "meeting_set").length;
      const donorTotal = donors.length;
      const donorContacted = donors.filter((d) => d.lastContactedAt).length;
      const donorResponded = donors.filter((d) => d.status === "responded" || d.status === "meeting_set").length;
      const donorFollowUpDue = donors.filter((d) => d.followUpDate && d.followUpDate < now && d.status !== "responded").length;
      return {
        school: { total: schoolTotal, emailed: schoolEmailed, followUpSent: schoolFollowUpSent, finalNudge: schoolFinalNudge, responded: schoolResponded, overdue: schoolOverdue, dueSoon: schoolDueSoon },
        media: { total: mediaTotal, sent: mediaSent, responded: mediaResponded },
        donors: { total: donorTotal, contacted: donorContacted, responded: donorResponded, followUpDue: donorFollowUpDue }
      };
    }),
    exportObsidian: adminProcedure2.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { schoolContacts: schoolContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { desc: desc2 } = await import("drizzle-orm");
      const db = await getDb2();
      const [schoolRows, mediaStatuses, donorRows] = await Promise.all([
        db ? db.select().from(schoolContacts2).orderBy(desc2(schoolContacts2.createdAt)) : [],
        getMediaOutreachStatuses(),
        getDonorContacts()
      ]);
      const now = /* @__PURE__ */ new Date();
      const dateStr = now.toISOString().split("T")[0];
      const lines = [];
      lines.push(`# The Vault \u2014 Campaign Export`);
      lines.push(`> Generated: ${now.toUTCString()}`);
      lines.push(`> Source: vet.thevaultinvestigates.cloud`);
      lines.push("");
      lines.push("---");
      lines.push("");
      lines.push("## \u{1F3EB} School Fellowship Outreach");
      lines.push("");
      const sentSchool = schoolRows.filter((r) => r.emailSent);
      const notSentSchool = schoolRows.filter((r) => !r.emailSent);
      lines.push(`**Total contacts:** ${schoolRows.length} | **Emailed:** ${sentSchool.length} | **Pending:** ${notSentSchool.length}`);
      lines.push("");
      if (sentSchool.length > 0) {
        lines.push("### Emailed Contacts");
        lines.push("");
        lines.push("| Principal | School | District | Status | Follow-up | Reply | Notes |");
        lines.push("|---|---|---|---|---|---|---|");
        for (const r of sentSchool) {
          const followUp = r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : "\u2014";
          const followUpSent = r.followUpSent ? "\u2713 Sent" : r.followUpDate ? "Pending" : "\u2014";
          const finalNudge = r.finalNudgeSent ? "\u2713 Sent" : "\u2014";
          const reply = r.replyNotes ? r.replyNotes.replace(/\|/g, "/").slice(0, 60) : "\u2014";
          const notes = r.internalNotes ? r.internalNotes.replace(/\|/g, "/").slice(0, 60) : "\u2014";
          lines.push(`| ${r.principalName} | ${r.schoolName} | ${r.district} | ${r.schoolOutreachStatus || "sent"} | ${followUp} (${followUpSent}) | ${reply} | ${notes} |`);
        }
        lines.push("");
      }
      if (notSentSchool.length > 0) {
        lines.push("### Not Yet Contacted");
        lines.push("");
        for (const r of notSentSchool) {
          lines.push(`- ${r.principalName} \u2014 ${r.schoolName}, ${r.district}`);
        }
        lines.push("");
      }
      lines.push("---");
      lines.push("");
      const MEDIA_CONTACTS = [
        { num: 1, name: "Dr. Jose Ramon G. Albert", org: "PIDS", email: "jrgalbert@gmail.com", day: 1 },
        { num: 2, name: "Philippine Center for Investigative Journalism", org: "PCIJ", email: "pcij@pcij.org", day: 1 },
        { num: 3, name: "Rappler", org: "Rappler", email: "newsdesk@rappler.com", day: 2 },
        { num: 4, name: "VERA Files", org: "VERA Files", email: "newsroom@verafiles.org", day: 2 },
        { num: 5, name: "Center for Media Freedom & Responsibility", org: "CMFR", email: "staff@cmfr-phil.org", day: 3 },
        { num: 6, name: "National Union of Journalists (NUJP)", org: "NUJP", email: "nujp@nujp.org", day: 3 },
        { num: 7, name: "Committee to Protect Journalists", org: "CPJ", email: "info@cpj.org", day: 4 },
        { num: 8, name: "Reporters Without Borders", org: "RSF", email: "rsf@rsf.org", day: 4 },
        { num: 9, name: "DSWD", org: "DSWD", email: "osec@dswd.gov.ph", day: 5 },
        { num: 10, name: "Philippine Daily Inquirer", org: "Inquirer", email: "newsroom@inquirer.com.ph", day: 5 }
      ];
      lines.push("## \u{1F4F0} Media Outreach \u2014 Top 10 Authorities");
      lines.push("");
      lines.push("| # | Name / Org | Day | Status | Last Contacted |");
      lines.push("|---|---|---|---|---|");
      for (const c of MEDIA_CONTACTS) {
        const status = mediaStatuses.find((s) => s.contactNum === c.num);
        const statusLabel = status?.status || "Not Sent";
        const lastContacted = status?.lastContactedAt ? new Date(status.lastContactedAt).toLocaleDateString() : "Never";
        lines.push(`| ${c.num} | **${c.name}** (${c.org}) | Day ${c.day} | ${statusLabel} | ${lastContacted} |`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
      lines.push("## \u{1F49B} Donor Outreach");
      lines.push("");
      const donors = donorRows;
      const byPlatform = {};
      for (const d of donors) {
        const p = d.platform || "other";
        if (!byPlatform[p]) byPlatform[p] = [];
        byPlatform[p].push(d);
      }
      const platformLabels = {
        kofi: "Ko-fi",
        buymeacoffee: "Buy Me a Coffee",
        grant: "Grant",
        individual: "Individual",
        other: "Other"
      };
      for (const [platform, list] of Object.entries(byPlatform)) {
        lines.push(`### ${platformLabels[platform] || platform} (${list.length})`);
        lines.push("");
        lines.push("| Name | Email | Status | Follow-up | Reply Notes | Internal Notes |");
        lines.push("|---|---|---|---|---|---|");
        for (const d of list) {
          const followUp = d.followUpDate ? new Date(d.followUpDate).toLocaleDateString() : "\u2014";
          const reply = d.replyNotes ? d.replyNotes.replace(/\|/g, "/").slice(0, 60) : "\u2014";
          const notes = d.internalNotes ? d.internalNotes.replace(/\|/g, "/").slice(0, 60) : "\u2014";
          lines.push(`| ${d.name} | ${d.email || "\u2014"} | ${d.status || "new"} | ${followUp} | ${reply} | ${notes} |`);
        }
        lines.push("");
      }
      if (donors.length === 0) {
        lines.push("_No donor contacts added yet._");
        lines.push("");
      }
      lines.push("---");
      lines.push("");
      lines.push(`*Exported from The Vault Investigates \u2014 ${dateStr}*`);
      return { markdown: lines.join("\n"), filename: `vault-campaign-export-${dateStr}.md` };
    })
  }),
  vloggerInquiries: vloggerInquiriesRouter,
  contacts: router({
    // Export all contacts across all categories as CSV, Markdown, and PDF-ready data
    exportAll: adminProcedure2.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vloggerInquiries: vloggerInquiriesTable, schoolContacts: schoolContactsTable, donorContacts: donorContactsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = await getDb2();
      const MEDIA_CONTACTS = [
        { num: 1, name: "Dr. Jose Ramon G. Albert", org: "PIDS", email: "jrgalbert@gmail.com" },
        { num: 2, name: "Philippine Center for Investigative Journalism", org: "PCIJ", email: "pcij@pcij.org" },
        { num: 3, name: "Rappler", org: "Rappler", email: "newsdesk@rappler.com" },
        { num: 4, name: "VERA Files", org: "VERA Files", email: "newsroom@verafiles.org" },
        { num: 5, name: "Center for Media Freedom & Responsibility", org: "CMFR", email: "staff@cmfr-phil.org" },
        { num: 6, name: "National Union of Journalists (NUJP)", org: "NUJP", email: "nujp@nujp.org" },
        { num: 7, name: "Committee to Protect Journalists", org: "CPJ", email: "info@cpj.org" },
        { num: 8, name: "Reporters Without Borders", org: "RSF", email: "rsf@rsf.org" },
        { num: 9, name: "DSWD", org: "DSWD", email: "osec@dswd.gov.ph" },
        { num: 10, name: "Philippine Daily Inquirer", org: "Inquirer", email: "newsroom@inquirer.com.ph" }
      ];
      const [vloggerRows, donorRows, schoolRows, mediaStatusRows] = await Promise.all([
        db ? db.select().from(vloggerInquiriesTable) : [],
        getDonorContacts(),
        db ? db.select().from(schoolContactsTable) : [],
        getMediaOutreachStatuses()
      ]);
      const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const allContacts = [];
      for (const v of vloggerRows) {
        allContacts.push({
          id: `VLG-${v.id}`,
          category: "Vlogger",
          name: v.creatorName || "",
          organisation: v.channelName || "",
          email: v.email || "",
          phone: "",
          platform: v.vloggerPlatform || "youtube",
          status: v.inquiryStatus || "not_sent",
          notes: v.internalNotes || "",
          dateAdded: v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : ""
        });
      }
      for (const d of donorRows) {
        allContacts.push({
          id: `DON-${d.id}`,
          category: "Donor",
          name: d.name || "",
          organisation: d.grantOrg || "",
          email: d.email || "",
          phone: "",
          platform: d.donorPlatform || "",
          status: d.donorStatus || "new",
          notes: d.internalNotes || "",
          dateAdded: d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : ""
        });
      }
      for (const s of schoolRows) {
        allContacts.push({
          id: `SCH-${s.id}`,
          category: "School Contact",
          name: s.principalName || "",
          organisation: s.schoolName || "",
          email: s.email || "",
          phone: s.phone || "",
          platform: "",
          status: s.schoolOutreachStatus || "not_sent",
          notes: s.internalNotes || "",
          dateAdded: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : ""
        });
      }
      for (const m of MEDIA_CONTACTS) {
        const statusRow = mediaStatusRows.find((r) => r.contactNum === m.num);
        allContacts.push({
          id: `MED-${m.num}`,
          category: "Media Outreach",
          name: m.name,
          organisation: m.org,
          email: m.email,
          phone: "",
          platform: "",
          status: statusRow?.mediaStatus || "not_sent",
          notes: statusRow?.responseNotes || "",
          dateAdded: statusRow?.lastContactedAt ? new Date(statusRow.lastContactedAt).toISOString().slice(0, 10) : ""
        });
      }
      const csvHeaders = ["ID", "Category", "Name", "Organisation", "Email", "Phone", "Platform", "Status", "Notes", "Date Added"];
      const escCsv = (val) => {
        if (!val) return "";
        const s = String(val).replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
      };
      const csvLines = [
        csvHeaders.join(","),
        ...allContacts.map((c) => [
          escCsv(c.id),
          escCsv(c.category),
          escCsv(c.name),
          escCsv(c.organisation),
          escCsv(c.email),
          escCsv(c.phone),
          escCsv(c.platform),
          escCsv(c.status),
          escCsv(c.notes),
          escCsv(c.dateAdded)
        ].join(","))
      ];
      const csv = csvLines.join("\n");
      const categories = ["Vlogger", "Donor", "School Contact", "Media Outreach"];
      const mdLines = [];
      mdLines.push("# The Vault Investigates \u2014 Contacts Export");
      mdLines.push("");
      mdLines.push(`**Exported:** ${dateStr}  `);
      mdLines.push(`**Total contacts:** ${allContacts.length}`);
      mdLines.push("");
      mdLines.push("---");
      mdLines.push("");
      for (const cat of categories) {
        const group = allContacts.filter((c) => c.category === cat);
        mdLines.push(`## ${cat}s (${group.length})`);
        mdLines.push("");
        if (group.length === 0) {
          mdLines.push("_No contacts in this category._");
          mdLines.push("");
          continue;
        }
        mdLines.push("| ID | Name | Organisation | Email | Phone | Platform | Status | Date Added |");
        mdLines.push("|---|---|---|---|---|---|---|---|");
        for (const c of group) {
          mdLines.push(`| ${c.id} | ${c.name || "\u2014"} | ${c.organisation || "\u2014"} | ${c.email || "\u2014"} | ${c.phone || "\u2014"} | ${c.platform || "\u2014"} | ${c.status} | ${c.dateAdded || "\u2014"} |`);
        }
        mdLines.push("");
      }
      mdLines.push("---");
      mdLines.push("");
      mdLines.push(`*The Vault Investigates \xB7 Contacts Export \xB7 ${dateStr}*`);
      const markdown = mdLines.join("\n");
      return {
        contacts: allContacts,
        csv,
        markdown,
        filename: `vault-contacts-${dateStr}`,
        exportedAt: dateStr,
        totalCount: allContacts.length,
        categoryCounts: {
          vloggers: allContacts.filter((c) => c.category === "Vlogger").length,
          donors: allContacts.filter((c) => c.category === "Donor").length,
          schools: allContacts.filter((c) => c.category === "School Contact").length,
          media: allContacts.filter((c) => c.category === "Media Outreach").length
        }
      };
    })
  }),
  creatorScan: router({
    // Run a multi-source scan for a given keyword
    runScan: adminProcedure2.input(z2.object({
      keywords: z2.array(z2.string()).min(1)
    })).mutation(async ({ input }) => {
      const results = [];
      for (const keyword of input.keywords) {
        try {
          const ytData = await callDataApi("Youtube/search", {
            query: { q: keyword, hl: "en", gl: "PH" }
          });
          const contents = ytData?.contents ?? [];
          for (const item of contents.slice(0, 5)) {
            if (item?.type === "video" && item.video) {
              const v = item.video;
              results.push({
                source: "youtube",
                title: v.title ?? "Untitled",
                url: `https://www.youtube.com/watch?v=${v.videoId}`,
                channelOrAuthor: v.channelTitle ?? "",
                description: v.descriptionSnippet ?? "",
                thumbnail: v.thumbnails?.[0]?.url ?? "",
                publishedAt: v.publishedTimeText ?? "",
                keyword
              });
            }
          }
        } catch (e) {
          console.warn("[CreatorScan] YouTube error:", e);
        }
        try {
          const encoded = encodeURIComponent(keyword);
          const rssUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-PH&gl=PH&ceid=PH:en`;
          const rssRes = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
          if (rssRes.ok) {
            const xml = await rssRes.text();
            const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
            for (const item of items.slice(0, 5)) {
              const titleMatch = item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ?? item.match(/<title>(.+?)<\/title>/);
              const linkMatch = item.match(/<link>(.+?)<\/link>/);
              const descMatch = item.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) ?? item.match(/<description>(.+?)<\/description>/);
              const pubMatch = item.match(/<pubDate>(.+?)<\/pubDate>/);
              const sourceMatch = item.match(/<source[^>]*>(.+?)<\/source>/);
              if (titleMatch && linkMatch) {
                results.push({
                  source: "google_news",
                  title: titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(),
                  url: linkMatch[1].trim(),
                  channelOrAuthor: sourceMatch?.[1] ?? "",
                  description: descMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "",
                  publishedAt: pubMatch?.[1] ?? "",
                  keyword
                });
              }
            }
          }
        } catch (e) {
          console.warn("[CreatorScan] Google News error:", e);
        }
        try {
          const redditRes = await fetch(
            `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&limit=5`,
            { headers: { "User-Agent": "VaultInvestigates/1.0" } }
          );
          if (redditRes.ok) {
            const redditData = await redditRes.json();
            const posts = redditData?.data?.children ?? [];
            for (const post of posts) {
              const p = post?.data;
              if (!p) continue;
              results.push({
                source: "reddit",
                title: p.title ?? "Untitled",
                url: `https://www.reddit.com${p.permalink}`,
                channelOrAuthor: `r/${p.subreddit}`,
                description: p.selftext?.slice(0, 200) ?? "",
                thumbnail: p.thumbnail?.startsWith("http") ? p.thumbnail : "",
                publishedAt: p.created_utc ? new Date(p.created_utc * 1e3).toISOString() : "",
                keyword
              });
            }
          }
        } catch (e) {
          console.warn("[CreatorScan] Reddit error:", e);
        }
        try {
          const vimeoRes = await fetch(
            `https://api.vimeo.com/videos?query=${encodeURIComponent(keyword)}&per_page=5&sort=relevant`,
            { headers: { "Authorization": `Bearer ${ENV.forgeApiKey}`, "Accept": "application/vnd.vimeo.*+json;version=3.4" } }
          );
          const vimeoSearchRes = await fetch(
            `https://vimeo.com/search?q=${encodeURIComponent(keyword)}&type=videos`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
          );
          const vimeoRss = await fetch(
            `https://vimeo.com/search?q=${encodeURIComponent(keyword)}&format=json`,
            { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
          );
          if (vimeoRss.ok) {
            const vimeoJson = await vimeoRss.json().catch(() => null);
            const clips = vimeoJson?.clips ?? vimeoJson?.data ?? [];
            for (const clip of clips.slice(0, 5)) {
              results.push({
                source: "vimeo",
                title: clip.name ?? clip.title ?? "Untitled",
                url: clip.link ?? clip.url ?? `https://vimeo.com/${clip.id}`,
                channelOrAuthor: clip.user?.name ?? "",
                description: clip.description ?? "",
                thumbnail: clip.pictures?.sizes?.[2]?.link ?? "",
                publishedAt: clip.created_time ?? "",
                keyword
              });
            }
          }
        } catch (e) {
          console.warn("[CreatorScan] Vimeo error:", e);
        }
      }
      return { results, total: results.length };
    }),
    // Save a lead to the database
    saveLead: adminProcedure2.input(z2.object({
      source: z2.enum(["youtube", "google_news", "reddit", "vimeo"]),
      title: z2.string(),
      url: z2.string(),
      channelOrAuthor: z2.string().optional(),
      description: z2.string().optional(),
      thumbnail: z2.string().optional(),
      publishedAt: z2.string().optional(),
      keyword: z2.string().optional()
    })).mutation(async ({ input }) => {
      await saveScanLead({
        source: input.source,
        title: input.title,
        url: input.url,
        channelOrAuthor: input.channelOrAuthor ?? null,
        description: input.description ?? null,
        thumbnail: input.thumbnail ?? null,
        publishedAt: input.publishedAt ?? null,
        keyword: input.keyword ?? null,
        leadStatus: "new"
      });
      return { success: true };
    }),
    // List all saved leads
    listLeads: adminProcedure2.query(async () => {
      return getAllScanLeads();
    }),
    // Update lead status
    updateLeadStatus: adminProcedure2.input(z2.object({ id: z2.number(), leadStatus: z2.string(), notes: z2.string().optional() })).mutation(async ({ input }) => {
      await updateScanLeadStatus(input.id, input.leadStatus, input.notes);
      return { success: true };
    }),
    // Delete a lead
    deleteLead: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteScanLead(input.id);
      return { success: true };
    })
  }),
  // ─── DEPED DIRECTORY ────────────────────────────────────────────────────────
  deped: router({
    count: protectedProcedure.query(() => getDepedSchoolCount()),
    regions: protectedProcedure.query(() => getDepedRegions()),
    provinces: protectedProcedure.input(z2.object({ region: z2.string().optional() })).query(({ input }) => getDepedProvinces(input.region)),
    search: protectedProcedure.input(z2.object({ query: z2.string().default(""), region: z2.string().optional(), province: z2.string().optional(), page: z2.number().default(1), pageSize: z2.number().default(50) })).query(({ input }) => searchDepedSchools(input.query, input.region, input.province, input.page, input.pageSize)),
    importFromCsv: adminProcedure2.mutation(async () => {
      let csvContent;
      try {
        csvContent = readFileSync("/home/ubuntu/deped_schools.csv", "utf-8");
      } catch {
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DepEd CSV file not found on server" });
      }
      const rows = parse(csvContent, { columns: true, skip_empty_lines: true });
      const schools = rows.map((r) => ({
        schoolId: r["school_id"] || r["School ID"] || r["schoolId"] || r["id"] || "",
        schoolName: r["school_name"] || r["School Name"] || r["schoolName"] || r["name"] || "",
        region: r["region"] || r["Region"] || "",
        province: r["province"] || r["Province"] || "",
        municipality: r["municipality"] || r["Municipality"] || r["City/Municipality"] || "",
        programs: r["programs"] || r["Programs"] || r["Strand"] || "",
        tvlSpecializations: r["tvl_specializations"] || r["TVL Specializations"] || r["tvlSpecializations"] || r["TVL"] || ""
      })).filter((s) => s.schoolName);
      const count = await bulkInsertDepedSchools(schools);
      return { imported: count };
    })
  }),
  // ─── MEDIA SCAN ─────────────────────────────────────────────────────────────
  mediaScan: router({
    search: protectedProcedure.input(z2.object({ query: z2.string().min(1), sources: z2.array(z2.enum(["Google News", "YouTube", "Reddit", "Google Web"])).default(["Google News"]) })).mutation(async ({ input }) => {
      const results = [];
      for (const source of input.sources) {
        try {
          if (source === "Google News") {
            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(input.query)}&hl=en-US&gl=US&ceid=US:en`;
            const res = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            const xml = await res.text();
            const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
            for (const item of items.slice(0, 10)) {
              const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
              const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
              const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "";
              if (title && link) results.push({ title, url: link, source: "Google News", snippet: description.replace(/<[^>]+>/g, "").slice(0, 200), publishedAt: null });
            }
          } else if (source === "Reddit") {
            const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(input.query)}&sort=relevance&limit=10`, { headers: { "User-Agent": "Mozilla/5.0" } });
            const json2 = await res.json();
            for (const post of json2?.data?.children || []) {
              const d = post.data;
              results.push({ title: d.title, url: `https://reddit.com${d.permalink}`, source: "Reddit", snippet: d.selftext?.slice(0, 200) || "", publishedAt: d.created_utc ? new Date(d.created_utc * 1e3).toISOString() : null });
            }
          } else if (source === "YouTube") {
            const res = await fetch(`https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(input.query)}&type=video&sort_by=upload_date`, { headers: { "User-Agent": "Mozilla/5.0" } });
            if (res.ok) {
              const json2 = await res.json();
              for (const v of (json2 || []).slice(0, 10)) {
                results.push({ title: v.title, url: `https://youtube.com/watch?v=${v.videoId}`, source: "YouTube", snippet: v.description?.slice(0, 200) || "", publishedAt: v.published ? new Date(v.published * 1e3).toISOString() : null });
              }
            }
          } else if (source === "Google Web") {
            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(input.query)}&hl=en&gl=US`;
            const res = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            const xml = await res.text();
            const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
            for (const item of items.slice(0, 10)) {
              const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
              const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
              const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "";
              if (title && link) results.push({ title, url: link, source: "Google Web", snippet: description.replace(/<[^>]+>/g, "").slice(0, 200), publishedAt: null });
            }
          }
        } catch (e) {
          console.warn(`[MediaScan] Error searching ${source}:`, e);
        }
      }
      return results;
    }),
    leads: router({
      list: protectedProcedure.input(z2.object({ status: z2.string().optional() })).query(({ input }) => getMediaLeads(input.status)),
      save: protectedProcedure.input(
        z2.object({
          title: z2.string(),
          url: z2.string(),
          source: z2.enum(["Google News", "YouTube", "Reddit", "Google Web"]),
          snippet: z2.string().optional(),
          publishedAt: z2.string().optional(),
          rightsStatus: z2.enum(["Unknown", "Free to Use", "Copyrighted", "Fair Use"]).default("Unknown")
        })
      ).mutation(async ({ input, ctx }) => {
        await createMediaLead({
          ...input,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : void 0,
          savedBy: ctx.user.name ?? ctx.user.email ?? "Unknown"
        });
        return { success: true };
      }),
      update: protectedProcedure.input(
        z2.object({
          id: z2.number(),
          status: z2.enum(["Lead", "Verified", "Coded", "Archived"]).optional(),
          rightsStatus: z2.enum(["Unknown", "Free to Use", "Copyrighted", "Fair Use"]).optional(),
          caseRef: z2.string().optional(),
          notes: z2.string().optional()
        })
      ).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateMediaLead(id, data);
        return { success: true };
      })
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function createApp() {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app2);
  registerOAuthRoutes(app2);
  registerAdminAuthRoutes(app2);
  app2.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}

// api-src/server.ts
var app = createApp();
var server_default = app;
export {
  server_default as default
};

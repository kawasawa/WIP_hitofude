import Dexie, { Table } from 'dexie';

import { constants } from './constants';
import { LanguageMode } from './enums';

const DB_VERSION = 1;

export type Documents = {
  id: string;
  order: number;
  title: string;
  text: string;
  languageMode: LanguageMode;
};

class DB extends Dexie {
  documents!: Table<Documents, string>;
  constructor() {
    super(constants.meta.title);
    this.version(DB_VERSION).stores({
      documents: '&id',
    });
  }
}

export const db = new DB();

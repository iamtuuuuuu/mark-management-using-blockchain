import * as CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';
const ec = new EC('secp256k1');

export interface Student {
  studentID: number;
  name: string;
  dob: string;
  address?: string;
  phone: string;
}

export interface Teacher {
  teacherID: number;
  name: string;
  level: string;
  department: string;
  phone: string;
}

export interface Course {
  name: string;
  semester: string;
  numberOfTC: number;
}

export class Data {
  teacher: Teacher;
  student: Student;
  course: Course;
  mark1: number;
  mark2: number;
  mark3: number;
  agvMark: number;

  constructor(
    teacher: Teacher,
    student: Student,
    course: Course,
    mark1: number,
    mark2: number,
    mark3: number
  ) {
    this.teacher = teacher;
    this.student = student;
    this.course = course;
    this.mark1 = mark1;
    this.mark2 = mark2;
    this.mark3 = mark3;
    this.agvMark = this.calculateAvgMark();
  }

  calculateAvgMark = (): number => {
    return this.mark1 * 0.1 + this.mark2 * 0.3 + this.mark3 * 0.6;
  };

  toString = (): string => {
    return (
      JSON.stringify(this.teacher) +
      JSON.stringify(this.student) +
      JSON.stringify(this.course) +
      JSON.stringify({
        mark1: this.mark1,
        mark2: this.mark2,
        mark3: this.mark3,
        avgMark: this.agvMark
      })
    );
  };
}

export class Transaction {
  fromAddress: string;
  toAddress: string;
  data: Data;
  timestamp: number;
  signature: any;

  constructor(fromAddress: string, toAddress: string, data: Data) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.data = data;
    this.timestamp = Date.now();
  }

  calculateHash = (): string => {
    return CryptoJS.SHA256(
      this.fromAddress +
        this.toAddress +
        this.data.toString() +
        this.timestamp.toString()
    ).toString();
  };

  signTransaction(signingKey: EC.KeyPair): void {
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }

    // Calculate the hash of this transaction, sign it with the key
    // and store it inside the transaction object
    const hashTx = this.calculateHash();
    const sig = signingKey.sign(hashTx, 'base64');

    this.signature = sig.toDER('hex');
  }

  isValid(): boolean {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

export class Block {
  timestamp: number;
  transactions: Transaction[];
  hash: string = '';
  previousHash: string;
  nonce: number;

  constructor(
    timestamp: number,
    transactions: Transaction[],
    previousHash = ''
  ) {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.nonce = 0;
  }

  calculateHash(): string {
    return CryptoJS.SHA256(
      this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
    ).toString();
  }

  mineBlock(difficulty: number) {
    this.hash = this.hash ? this.hash : '';
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block mined: ${this.hash}`);
  }

  hasValidTransactions(): boolean {
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

export class Blockchain {
  chain: Block[];
  difficulty: number;
  pendingTransactions: Transaction[];

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
  }

  createGenesisBlock(): Block {
    return new Block(Date.parse('2021-01-01'), [], '0');
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress: string): void {
    const block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    this.pendingTransactions = [];
  }

  addTransaction(transaction: Transaction): void {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    // Verify the transaction
    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    if (transaction.data.agvMark < 0) {
      throw new Error('avengers must be greater than or equal to zero');
    }
    this.pendingTransactions.push(transaction);
    console.log('transaction added: %s', transaction);
  }

  getALLMarksOfAddress(address: string): Transaction[] {
    let transactions: Transaction[] = [];

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.toAddress === address) {
          transactions.push(trans);
        }
      }
    }
    return transactions;
  }

  getAllTransactionsForWallet(address: string): Transaction[] {
    const txs: Transaction[] = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    console.log('get transactions for wallet count: %s', txs.length);
    return txs;
  }

  isChainValid(): boolean {
    // Check if the Genesis block hasn't been tampered with by comparing
    // the output of createGenesisBlock with the first block on our chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());
    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    // Check the remaining blocks on the chain to see if there hashes and
    // signatures are correct
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (previousBlock.hash !== currentBlock.previousHash) {
        return false;
      }

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
    }

    return true;
  }
}

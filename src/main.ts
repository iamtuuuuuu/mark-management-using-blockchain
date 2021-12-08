import {Blockchain, Course, Data, Student, Teacher, Transaction} from "./blockchain";

import {ec as EC} from 'elliptic'

const ec = new EC('secp256k1')

const myKey = ec.keyFromPrivate('8653fed90f1dd4c7ea436f20038278e4b5f96bce7947d58d7b5e7ecfe7ea3a1b');

// From that we can calculate your public key (which doubles as your wallet address)
const myWalletAddress = myKey.getPublic('hex');

const ql = new Blockchain();

const teacher: Teacher = {
    teacherID: 1,
    name: 'tu',
    level: 'aaa',
    department: 'cntt',
    phone: '123'
}

const student: Student = {
    studentID: 1,
    name: 'tu hoc sinh',
    dob: 'aaa',
    phone: '123'
}

const course: Course = {
    name: 'string',
    semester: 'ki 1 2021',
    numberOfTC: 2,
}

const data = new Data(teacher, student, course, 10, 10, 9)

// Create a transaction & sign it with your key
const tx1 = new Transaction(myWalletAddress, 'diachihstu', data);
tx1.signTransaction(myKey);
ql.addTransaction(tx1);

// Mine block
ql.minePendingTransactions(myWalletAddress);

// Create a transaction & sign it with your key
const tx2 = new Transaction(myWalletAddress, 'diachihstu', data);
tx2.signTransaction(myKey);
ql.addTransaction(tx2);

// Mine block
ql.minePendingTransactions(myWalletAddress);

console.log('blockchain', ql)

console.log(ql.getALLMarksOfAddress('diachihstu')[0].data)
console.log(ql.getALLMarksOfAddress('diachihstu')[1].data)

console.log(ql.getAllTransactionsForWallet('0413e6bb6695eec8137eb2bf2a2c45cd271a8cc35f2a17a02744510123ea151a79a16d8bf0dc3c862ebfe4ebc33a2d9f267eb18295eebe8eda8d3c46d129c49f73'))


//Requires
const mysql = require('mysql');
const { promisify } = require('util');

//DBConnection
//  const poolConnection = mysql.createPool({
//      host: 'avanzodb.ckyaf6mq6hy9.us-east-2.rds.amazonaws.com',
//      user: 'appavanzo',
//      password: '$vAnk6SpQBcNzY97E',
//      database: 'avanzo',
//  });

const poolConnection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'avanzo',
});

//HandleConnection
poolConnection.getConnection((err, connection) => {
    if(err){
        if (err.code === 'PROTOCOL_CONNECTION_LOST'){
            console.error('DATABASE CONNECTION WAS CLOSED');
        }
        if (err.code === 'ER_CON_COUNT_ERROR'){
            console.error('DATABASE HAS TO MANY CONNECTIONS');
        }
        if (err.code === 'ECONNREFUSED'){
            console.error('DATABASE CONNECTION WAS REFUSED');
        }
    }

    if (connection) {
        connection.release();
        console.log('DB is connected');
        return;
    }
});


poolConnection.query = promisify(poolConnection.query);

module.exports = poolConnection;

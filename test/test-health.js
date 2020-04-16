// Load environment variables
require('dotenv').config()

// const describe = require("mocha").describe;npm install --save-dev eslint-plugin-mocha
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
chai.use(chaiHttp)

describe('Health', function () {
  describe('Check', function () {
    it('Should return API status', function (done) {
      chai
        .request(server)
        .get('/api/health')
        .send()
        .end((err, res) => {
          // console.log (res)
          // console.log("err",err);
          res.should.have.status(200)
          console.log('Response Body:', res.body)
          // console.log (result);
          done()
        })
    })
  })
})

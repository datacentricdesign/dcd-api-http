// Load environment variables
require('dotenv').config()

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
chai.use(chaiHttp)
let expect = chai.expect

describe('Health', function () {
  describe('Check', function () {
    it('Should return API status', function (done) {
      chai
        .request(server)
        .get('/api/health')
        .send()
        .end((err, res) => {
          expect(res.status).to.equal(200)
          done()
        })
    })
  })
})

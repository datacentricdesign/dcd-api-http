// Load environment variables
require('dotenv').config()

// const describe = require("mocha").describe;
// const it = require("mocha").it;
const assert = require('assert')
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
let should = chai.should()
let expect = chai.expect
chai.use(chaiHttp)

const bearerToken = process.env.TEST_BEARER_TOKEN

describe('Persons', function () {
  let testPerson = {
    id: 'test10@datacentricdesign.org',
    name: 'Test',
    password: 'Test123'
  }
  describe('Create', function () {
    it('Should create a Person', function (done) {
      chai
        .request(server)
        .post('/api/persons')
        .send(testPerson)
        .end((err, res) => {
          console.log('Response Body:', res.body)
          res.should.have.status(201)
          expect(res.body.personId).equal('dcd:persons:' + testPerson.id)
          testPerson.id = res.body.personId
          done()
        })
    })
  })

})

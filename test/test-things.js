// Load environment variables
require('dotenv').config()

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
let expect = chai.expect
chai.use(chaiHttp)

const bearerToken = process.env.TEST_BEARER_TOKEN

describe('Things', function () {
  let testThing = {
    name: 'Nano Example',
    type: 'Arduino',
    description: 'Arduino Nano 33 IoT'
  }
  let testProperty = {
    name: 'My Accelerometer',
    description: 'An test property of type Accelerometer',
    type: 'ACCELEROMETER'
  }
  describe('Create', function () {
    it('Should create a Thing', function (done) {
      chai
        .request(server)
        .post('/api/things')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(testThing)
        .end((err, res) => {
          res.should.have.status(201)
          expect(res.body.thing.name).equal(testThing.name)
          expect(res.body.thing.id).to.be.a('string')
          testThing.id = res.body.thing.id
          testProperty.thingId = res.body.thing.id
          done()
        })
    })
  })

  describe('List', function () {
    it('Should return the list of Things', function (done) {
      chai
        .request(server)
        .get('/api/things')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          console.log('Response Body:', res.body)
          done()
        })
    })
  })

  describe('Read', function () {
    it('Should return the Thing', function (done) {
      chai
        .request(server)
        .get('/api/things/' + testThing.id)
        .set('Authorization', 'Bearer ' + bearerToken)
        .send()
        .end((err, res) => {
          //console.log (res)
          // console.log("err",err);
          res.should.have.status(200)
          res.body.thing.name.should.equal(testThing.name)
          console.log('Response Body:', res.body)
          // console.log (result);
          done()
        })
    })
  })

  describe('Create Property', function () {
    it('Should create a Property', function (done) {
      chai
        .request(server)
        .post('/api/things' + testThing.id + '/properties')
        .set('Authorization', 'Bearer ' + bearerToken)
        .send(testProperty)
        .end((err, res) => {
          res.should.have.status(201)
          expect(res.body.property.name).equal(testProperty.name)
          expect(res.body.property.id).to.be.a('string')
          testThing.id = res.body.thing.id
          done()
        })
    })
  })

  describe('Delete', function () {
    it('Should delete the created Thing', function (done) {
      chai
        .request(server)
        .delete('/api/things/' + testThing.id)
        .set('Authorization', 'Bearer ' + bearerToken)
        .send()
        .end((err, res) => {
          //console.log (res)
          // console.log("err",err);
          res.should.have.status(200)
          expect(res.body.message).to.equal('1 Thing(s) deleted.')
          console.log('Response Body:', res.body)
          // console.log (result);
          done()
        })
    })
  })
})

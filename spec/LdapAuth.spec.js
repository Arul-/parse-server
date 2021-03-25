const ldap = require('../lib/Adapters/Auth/ldap');
const mockLdapServer = require('./support/MockLdapServer');
const fs = require('fs');
const port = 12345;
const sslport = 12346;

it('Should fail with missing options', done => {
  ldap
    .validateAuthData({ id: 'testuser', password: 'testpw' })
    .then(done.fail)
    .catch(err => {
      jequal(err.message, 'LDAP auth configuration missing');
      done();
    });
});

it('Should return a resolved promise when validating the app id', done => {
  ldap.validateAppId().then(done).catch(done.fail);
});

<<<<<<< HEAD
it('Should succeed with right credentials', done => {
  mockLdapServer(port, 'uid=testuser, o=example').then(server => {
=======
  it('Should succeed with right credentials', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example');
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
    };
<<<<<<< HEAD
    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done)
      .catch(done.fail)
      .finally(() => server.close());
=======
    await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should succeed with right credentials when LDAPS is used and certifcate is not checked', done => {
  mockLdapServer(sslport, 'uid=testuser, o=example', false, true).then(server => {
=======
  it('Should succeed with right credentials when LDAPS is used and certifcate is not checked', async done => {
    const server = await mockLdapServer(sslport, 'uid=testuser, o=example', false, true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldaps://localhost:${sslport}`,
      dn: 'uid={{id}}, o=example',
      tlsOptions: { rejectUnauthorized: false },
    };
<<<<<<< HEAD
    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done)
      .catch(done.fail)
      .finally(() => server.close());
=======
    await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should succeed when LDAPS is used and the presented certificate is the expected certificate', done => {
  mockLdapServer(sslport, 'uid=testuser, o=example', false, true).then(server => {
=======
  it('Should succeed when LDAPS is used and the presented certificate is the expected certificate', async done => {
    const server = await mockLdapServer(sslport, 'uid=testuser, o=example', false, true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldaps://localhost:${sslport}`,
      dn: 'uid={{id}}, o=example',
      tlsOptions: {
        ca: fs.readFileSync(__dirname + '/support/cert/cert.pem'),
        rejectUnauthorized: true,
      },
    };
<<<<<<< HEAD
    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done)
      .catch(done.fail)
      .finally(() => server.close());
=======
    await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should fail when LDAPS is used and the presented certificate is not the expected certificate', done => {
  mockLdapServer(sslport, 'uid=testuser, o=example', false, true).then(server => {
=======
  it('Should fail when LDAPS is used and the presented certificate is not the expected certificate', async done => {
    const server = await mockLdapServer(sslport, 'uid=testuser, o=example', false, true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldaps://localhost:${sslport}`,
      dn: 'uid={{id}}, o=example',
      tlsOptions: {
        ca: fs.readFileSync(__dirname + '/support/cert/anothercert.pem'),
        rejectUnauthorized: true,
      },
    };
<<<<<<< HEAD
    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done.fail)
      .catch(err => {
        jequal(err.message, 'LDAPS: Certificate mismatch');
        done();
      })
      .finally(() => server.close());
=======
    try {
      await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
      fail();
    } catch (err) {
      expect(err.message).toBe('LDAPS: Certificate mismatch');
    }
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should fail when LDAPS is used certifcate matches but credentials are wrong', done => {
  mockLdapServer(sslport, 'uid=testuser, o=example', false, true).then(server => {
=======
  it('Should fail when LDAPS is used certifcate matches but credentials are wrong', async done => {
    const server = await mockLdapServer(sslport, 'uid=testuser, o=example', false, true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldaps://localhost:${sslport}`,
      dn: 'uid={{id}}, o=example',
      tlsOptions: {
        ca: fs.readFileSync(__dirname + '/support/cert/cert.pem'),
        rejectUnauthorized: true,
      },
    };
<<<<<<< HEAD
    ldap
      .validateAuthData({ id: 'testuser', password: 'wrong!' }, options)
      .then(done.fail)
      .catch(err => {
        jequal(err.message, 'LDAP: Wrong username or password');
        done();
      })
      .finally(() => server.close());
=======
    try {
      await ldap.validateAuthData({ id: 'testuser', password: 'wrong!' }, options);
      fail();
    } catch (err) {
      expect(err.message).toBe('LDAP: Wrong username or password');
    }
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should fail with wrong credentials', done => {
  mockLdapServer(port, 'uid=testuser, o=example').then(server => {
=======
  it('Should fail with wrong credentials', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example');
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
    };
<<<<<<< HEAD
    ldap
      .validateAuthData({ id: 'testuser', password: 'wrong!' }, options)
      .then(done.fail)
      .catch(err => {
        jequal(err.message, 'LDAP: Wrong username or password');
        done();
      })
      .finally(() => server.close());
=======
    try {
      await ldap.validateAuthData({ id: 'testuser', password: 'wrong!' }, options);
      fail();
    } catch (err) {
      expect(err.message).toBe('LDAP: Wrong username or password');
    }
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should succeed if user is in given group', done => {
  mockLdapServer(port, 'uid=testuser, o=example').then(server => {
=======
  it('Should succeed if user is in given group', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example');
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
      groupCn: 'powerusers',
      groupFilter: '(&(uniqueMember=uid={{id}}, o=example)(objectClass=groupOfUniqueNames))',
    };
<<<<<<< HEAD

    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done)
      .catch(done.fail)
      .finally(() => server.close());
=======
    await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should fail if user is not in given group', done => {
  mockLdapServer(port, 'uid=testuser, o=example').then(server => {
=======
  it('Should fail if user is not in given group', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example');
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
      groupCn: 'groupTheUserIsNotIn',
      groupFilter: '(&(uniqueMember=uid={{id}}, o=example)(objectClass=groupOfUniqueNames))',
    };
<<<<<<< HEAD

    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done.fail)
      .catch(err => {
        jequal(err.message, 'LDAP: User not in group');
        done();
      })
      .finally(() => server.close());
=======
    try {
      await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
      fail();
    } catch (err) {
      expect(err.message).toBe('LDAP: User not in group');
    }
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should fail if the LDAP server does not allow searching inside the provided suffix', done => {
  mockLdapServer(port, 'uid=testuser, o=example').then(server => {
=======
  it('Should fail if the LDAP server does not allow searching inside the provided suffix', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example');
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=invalid',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
      groupCn: 'powerusers',
      groupFilter: '(&(uniqueMember=uid={{id}}, o=example)(objectClass=groupOfUniqueNames))',
    };
<<<<<<< HEAD

    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done.fail)
      .catch(err => {
        jequal(err.message, 'LDAP group search failed');
        done();
      })
      .finally(() => server.close());
=======
    try {
      await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
      fail();
    } catch (err) {
      expect(err.message).toBe('LDAP group search failed');
    }
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should fail if the LDAP server encounters an error while searching', done => {
  mockLdapServer(port, 'uid=testuser, o=example', true).then(server => {
=======
  it('Should fail if the LDAP server encounters an error while searching', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example', true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
      groupCn: 'powerusers',
      groupFilter: '(&(uniqueMember=uid={{id}}, o=example)(objectClass=groupOfUniqueNames))',
    };
<<<<<<< HEAD

    ldap
      .validateAuthData({ id: 'testuser', password: 'secret' }, options)
      .then(done.fail)
      .catch(err => {
        jequal(err.message, 'LDAP group search failed');
        done();
      })
      .finally(() => server.close());
=======
    try {
      await ldap.validateAuthData({ id: 'testuser', password: 'secret' }, options);
      fail();
    } catch (err) {
      expect(err.message).toBe('LDAP group search failed');
    }
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should delete the password from authData after validation', done => {
  mockLdapServer(port, 'uid=testuser, o=example', true).then(server => {
=======
  it('Should delete the password from authData after validation', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example', true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
    };
<<<<<<< HEAD

    const authData = { id: 'testuser', password: 'secret' };

    ldap
      .validateAuthData(authData, options)
      .then(() => {
        expect(authData).toEqual({ id: 'testuser' });
        done();
      })
      .catch(done.fail)
      .finally(() => server.close());
=======
    const authData = { id: 'testuser', password: 'secret' };
    await ldap.validateAuthData(authData, options);
    expect(authData).toEqual({ id: 'testuser' });
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

<<<<<<< HEAD
it('Should not save the password in the user record after authentication', done => {
  mockLdapServer(port, 'uid=testuser, o=example', true).then(server => {
=======
  it('Should not save the password in the user record after authentication', async done => {
    const server = await mockLdapServer(port, 'uid=testuser, o=example', true);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
    const options = {
      suffix: 'o=example',
      url: `ldap://localhost:${port}`,
      dn: 'uid={{id}}, o=example',
    };
<<<<<<< HEAD
    reconfigureServer({ auth: { ldap: options } }).then(() => {
      const authData = { authData: { id: 'testuser', password: 'secret' } };
      Parse.User.logInWith('ldap', authData).then(returnedUser => {
        const query = new Parse.Query('User');
        query
          .equalTo('objectId', returnedUser.id)
          .first({ useMasterKey: true })
          .then(user => {
            expect(user.get('authData')).toEqual({ ldap: { id: 'testuser' } });
            expect(user.get('authData').ldap.password).toBeUndefined();
            done();
          })
          .catch(done.fail)
          .finally(() => server.close());
      });
    });
=======
    await reconfigureServer({ auth: { ldap: options } });
    const authData = { authData: { id: 'testuser', password: 'secret' } };
    const returnedUser = await Parse.User.logInWith('ldap', authData);
    const query = new Parse.Query('User');
    const user = await query.equalTo('objectId', returnedUser.id).first({ useMasterKey: true });
    expect(user.get('authData')).toEqual({ ldap: { id: 'testuser' } });
    expect(user.get('authData').ldap.password).toBeUndefined();
    server.close(done);
>>>>>>> 1666c3e... [WIP] Enable test suite to be randomized (#7265)
  });
});

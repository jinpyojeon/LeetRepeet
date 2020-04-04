select v.description, v.level from MOCK_DATA as v INNER JOIN ( select Problem from main_db where user = 1 LIMIT 15) as v2 ON v.id=v2.Problem;
--var date = new Date();
---- console.log(date.toISOString()); // convert to GMT to compare
---- console.log(alasql("SELECT * FROM Information WHERE problemDate > ?",[date.toISOString()]));
---- var x=alasql('SELECT VALUE problemDate FROM Information WHERE problemDate > ?',[date.toISOString()]);
---- console.log(new Date(x));
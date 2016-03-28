
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define("setUserCredits", function(request, response) {

    // The rest of the function operates on the assumption that request.user is *authorized*

    Parse.Cloud.useMasterKey();

    // Query for the user to be modified by username
    // The username is passed to the Cloud Function in a
    // key named "username". You can search by email or
    // user id instead depending on your use case.

    var query = new Parse.Query(Parse.User);
    query.get(request.params.user,
    {
        success: function(object)
        {
            object.set("creditPoints",request.params.credits);
            object.save(null, {
                success: function(anotherUser) {
                  // The user was saved successfully.
                  response.success("Successfully updated user.");
                },
                error: function(gameScore, error) {
                  // The save failed.
                  // error is a Parse.Error with an error code and description.
                  response.error("Could not save changes to user.");
                }
            });

            response.success();
        },

        error: function(object, error)
        {
            console.log("user retrieved error");
            response.error();
        }
     });

});

Parse.Cloud.define("removeNotes", function(request, response) {

    // The rest of the function operates on the assumption that request.user is *authorized*

    Parse.Cloud.useMasterKey();

    // Query for the user to be modified by username
    // The username is passed to the Cloud Function in a
    // key named "username". You can search by email or
    // user id instead depending on your use case.

    var noteIds = request.params.noteIds;
    for(var i=0;i<noteIds.length;i++)
    {
      var Note = Parse.Object.extend("Note");
      var query = new Parse.Query(Note);
      var notesDestroyed = 0;
      var valorationsDestroyed = 0;
      query.get(noteIds[i], {
        success: function(note)
        {
          var likesQuery = new Parse.Query("Valoration");
          likesQuery.equalTo("Note", note);
          likesQuery.find({
            success: function(valorations) {
              if(valorations.length == 0)
              {
                note.destroy({
                  success: function(myObject) {
                    notesDestroyed++;
                    if(notesDestroyed >= noteIds.length)
                    {
                      response.success("200");
                    }
                    console.log("NOTA BORRADA");
                  },
                  error: function(myObject, error) {
                    notesDestroyed++;
                    if(notesDestroyed >= noteIds.length)
                    {
                      response.success("200");
                    }
                    console.log(error);
                  }
                });
              }
              for(var j=0;j<valorations.length;j++)
              {
                valorations[j].destroy({
                  success: function(myObject) {
                    valorationsDestroyed++;
                    if(valorationsDestroyed >= valorations.length)
                    {
                      note.destroy({
                        success: function(myObject) {
                          notesDestroyed++;
                          if(notesDestroyed >= noteIds.length)
                          {
                            response.success("200");
                          }
                        },
                        error: function(myObject, error) {
                          notesDestroyed++;
                          if(notesDestroyed >= noteIds.length)
                          {
                            response.success("200");
                          }
                          console.log(error);
                        }
                      });
                    }
                  },
                  error: function(myObject, error) {
                    if(valorationsDestroyed >= valorations.length)
                    {
                      note.destroy({
                        success: function(myObject) {
                          notesDestroyed++;
                          if(notesDestroyed >= noteIds.length)
                          {
                            response.success("200");
                          }
                          console.log("NOTA BORRADA");
                        },
                        error: function(myObject, error) {
                          notesDestroyed++;
                          if(notesDestroyed >= noteIds.length)
                          {
                            response.success("200");
                          }
                          console.log(error);
                        }
                      });
                    }
                    console.log(error);
                  }
                });
              }
            },
            error: function(myObject, error) {
              note.destroy({
                success: function(myObject) {
                  notesDestroyed++;
                  if(notesDestroyed >= noteIds.length)
                  {
                    response.success("200");
                  }
                },
                error: function(myObject, error) {
                  notesDestroyed++;
                  if(notesDestroyed >= noteIds.length)
                  {
                    response.success("200");
                  }
                  console.log(error);
                }
              });
            }
          });


        },
        error: function(object, error)
        {
            console.log("notes delete error: " + error);
            response.success(error);
        }
      });
    }

});

Parse.Cloud.define("setUserHash", function(request, response) {

    Parse.Cloud.useMasterKey();

    var query = new Parse.Query(Parse.User);
    query.equalTo("email",request.params.email);
    query.first({
        success: function(user)
        {
            user.set("hash",request.params.hash);
            user.save(null, {
                success: function(anotherUser) {
                  // The user was saved successfully.
                  response.success("Successfully updated user.");
                },
                error: function(gameScore, error) {
                  // The save failed.
                  // error is a Parse.Error with an error code and description.
                  response.error("Could not save changes to user.");
                }
            });

            response.success();
        },

        error: function(object, error)
        {
            console.log("user retrieved error");
            response.error();
        }
     });

});

Parse.Cloud.define("setUserPassword", function(request, response) {

    Parse.Cloud.useMasterKey();

    var query = new Parse.Query(Parse.User);
    query.equalTo("hash",request.params.hash);
    query.first({
        success: function(user)
        {
            user.setPassword(request.params.password,null);
            user.save(null, {
                success: function(anotherUser) {
                  // The user was saved successfully.
                  response.success("Successfully updated user.");
                },
                error: function(gameScore, error) {
                  // The save failed.
                  // error is a Parse.Error with an error code and description.
                  response.error("Could not save changes to user.");
                }
            });

            response.success();
        },

        error: function(object, error)
        {
            console.log("user retrieved error");
            response.error();
        }
     });

});

Parse.Cloud.define("AddViewToAdd",function(request,response){

    var adId = request.params.adid;
    var user = request.user;

    var Ad = Parse.Object.extend("Ad");
    var query = new Parse.Query(Ad);
    query.include("Author");
    query.get(adId, {
        success: function(ad) {
            var relation = user.relation("viewedAds");
            relation.add(ad);
            var userCurrentPoints = user.get("points");
            user.set("points",userCurrentPoints + 10);
            user.save(null, {
                success: function(user){
                },
                error: function(user, error) {
                    response.success({code:error.code,error:error})
                }
            });

            ad.set("pendingViews",ad.get("pendingViews") > 0 ? ad.get("pendingViews") - 1 : 0 );
            ad.save(null, {
                success: function(ad) {
                    response.success({code : "200",response : ""});
                },
                error: function(asd, error) {
                    console.log("Error al guardar anuncio");
                    response.success({code : error.code,response : error});
                }
            });
            var adCredits = ad.get("MaxPrice");
            var User = Parse.Object.extend("User");
            var userQuery = new Parse.Query(User);
            userQuery.get(ad.get("Author").id, {
                success: function(user) {
                    var userCurrentCredits = user.get("creditPoints");
                    if(userCurrentCredits > adCredits)
                    {
                        Parse.Cloud.run('setUserCredits', { user: user.id,credits: parseInt(userCurrentCredits - adCredits)}, {
                          success: function(status) {
                            // the user was updated successfully
                            console.log("EL usuario se ha guardado bien");
                          },
                          error: function(error) {
                            // error
                            console.log("Error al guardar usuario: " + error);
                          }
                        });

                    }
                    else
                    {
                        Parse.Cloud.run('setUserCredits', { user: user.id,credits: 0}, {
                          success: function(status) {
                            // the user was updated successfully
                            console.log("EL usuario se ha guardado bien con 0 creditos");
                          },
                          error: function(error) {
                            // error
                            console.log("Error al guardar usuario: " + error);
                          }
                        });
                        ad.set("status",2);
                        ad.save(null, {
                            success: function(ad) {
                            },
                            error: function(asd, error) {
                            }
                        });
                        //sendMail("No tienes credidos","El anuncio en: " + ad.get("LocationText") + " no se va a mostrar más porque te has quedado sin creditos en tu cuenta.","Your Yeapp account has no more credits",user.get("email"),user.get("username"));
                    }
                }
            });

        },
        error: function(ad, error) {
            response.success({code:error.code,error:error})
        }
    });

});

Parse.Cloud.define("AddViewToNote",function(request,response){
    var noteId = request.params.noteid;
    var user = request.user;

    var Note = Parse.Object.extend("Note");
    var query = new Parse.Query(Note);
    query.include("Author");
    query.get(noteId, {
        success: function(note) {
          if(user.id == note.get("Author").id)
          {
            response.success({code : "200",response : "Self note"});
          }
          else
          {
            var userCurrentPoints = user.get("points");
            user.set("points",userCurrentPoints + 1);

            var relation = user.relation("viewedNotes");
            relation.add(note);
            user.save(null, {
                success: function(user){
                    response.success({code : "200",response : ""});
                },
                error: function(user, error) {
                    response.success({code:error.code,error:error})
                }
            });
          }

        },
        error: function(ad, error) {
            response.success({code:error.code,error:error})
        }
    });
});

Parse.Cloud.define("GetNotesByLocation",function(request,response){
    var user = request.user;
    if(user){
       var notesArray = [];
        var query = new Parse.Query("Note");
        var maxDistance = request.params.distance;
        var location = new Parse.GeoPoint({latitude: request.params.latitude,longitude: request.params.longitude});
        query.withinKilometers("Position",location,maxDistance);
        query.include("Author");
        query.limit(1000);
        /*
      var oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query.greaterThan("createdAt",oneWeekAgo);
        */
        var notesWithLikeInfoReady = 0;
        query.find({
            success: function(results) {
                if(results.length == 0)
                {
                    response.success(notesArray);
                }
                for (var i = 0; i < results.length; ++i) {
                    //Para cada nota
                    var query = new Parse.Query("Note");
                    query.get(results[i].id, {
                      success: function(parseNote){
                        //Sacamos toda la info del autor de la nota
                        var query = new Parse.Query("User");
                        query.get(parseNote.get("Author").id, {
                          success: function(noteAuthor){
                                var relation = user.relation("viewedNotes");
                                var viewedNotesQuery = relation.query();
                                viewedNotesQuery.equalTo("objectId", parseNote.id);
                                viewedNotesQuery.find({
                                  success:function(notesViewedByUser) {
                                        var count = notesViewedByUser.length;
                                        //Likes relacionados con nota
                                        var likesQuery = new Parse.Query("Valoration");
                                        likesQuery.equalTo("Note", parseNote);
                                        likesQuery.include("Author");
                                        likesQuery.find({
                                            success: function(valorations) {
                                                //Valoraciones para la nota
                                                var note = new Object();
                                                note.liked = false;
                                                note.hated = false;
                                                var positiveValorations = 0;
                                                var negativeValorations = 0;
                                                for (var j = 0; j < valorations.length; j++) {
                                                    if(valorations[j].get("positive"))
                                                    {
                                                        if(valorations[j].get("Author").id === user.id)
                                                        {
                                                            note.liked = true;
                                                        }
                                                        positiveValorations++;
                                                    }
                                                    else
                                                    {
                                                        if(valorations[j].get("Author").id === user.id)
                                                        {
                                                            note.hated = true;
                                                        }
                                                        negativeValorations++;
                                                    }
                                                }



                                                note.objectId = parseNote.id;
                                                note.coordinateLatitude = parseNote.get("Position").latitude;
                                                note.coordinateLongitude = parseNote.get("Position").longitude;
                                                note.content = parseNote.get("Text");
                                                note.textLocation = parseNote.get("LocationText");
                                                note.authorId = noteAuthor.id;
                                                note.authorName = noteAuthor.get("username");
                                                if(typeof(noteAuthor.get("image")) === 'undefined')
                                                {
                                                  note.authorImage = noteAuthor.get("facebookimage");
                                                }
                                                else
                                                {
                                                  note.authorImage = noteAuthor.get("image").url();
                                                }
                                                note.UpdatedAt = parseNote.updatedAt;
                                                note.CreatedAt = parseNote.createdAt;
                                                if(count > 0)
                                                {
                                                  note.viewed = true;
                                                }
                                                else
                                                {
                                                  note.viewed = false;
                                                }

                                                note.likesCount = positiveValorations;
                                                note.hatesCount = negativeValorations;
                                                notesArray.push(note);
                                                if(notesArray.length >= results.length)
                                                {
                                                    response.success(notesArray);
                                                }
                                            },
                                            error: function() {
                                              response.error("error extracting likes");
                                            }
                                        });
                                  },
                                    error: function() {
                                        response.error("error extracting viewed notes");
                                    }
                                });
                              }
                          });

                      },
                      error: function() {
                          response.error("error extracting note");
                        }
                    });


                }
            },
            error: function() {
              response.error("error extracting notes");
            }
        });

    }
    else
    {
        response.error("no user");
    }

});

Parse.Cloud.define("GetNotesByAuthor",function(request,response){
    var user = request.user;
    if(user){
       var notesArray = [];
        var query = new Parse.Query("Note");
        query.equalTo("Author", user);
        query.include("Author");
        query.limit(1000);
        var notesWithLikeInfoReady = 0;
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; ++i) {
                    //Para cada nota

                    var query = new Parse.Query("Note");
                    query.get(results[i].id, {
                      success: function(parseNote){
                        //Sacamos toda la info del autor de la nota
                        var query = new Parse.Query("User");
                        query.get(parseNote.get("Author").id, {
                          success: function(noteAuthor){
                                  //Likes relacionados con nota
                                  var likesQuery = new Parse.Query("Valoration");
                                  likesQuery.equalTo("Note", parseNote);
                                  likesQuery.include("Author");
                                  likesQuery.find({
                                      success: function(valorations) {
                                        console.log("Valoraciones es: " + JSON.stringify(valorations));
                                          //Valoraciones para la nota
                                          var note = new Object();
                                          note.liked = false;
                                          note.hated = false;
                                          var positiveValorations = 0;
                                          var negativeValorations = 0;
                                          for (var j = 0; j < valorations.length; j++) {
                                              if(valorations[j].get("positive"))
                                              {
                                                  if(valorations[j].get("Author").id === user.id)
                                                  {
                                                      note.liked = true;
                                                  }
                                                  positiveValorations++;
                                              }
                                              else
                                              {
                                                  if(valorations[j].get("Author").id === user.id)
                                                  {
                                                      note.hated = true;
                                                  }
                                                  negativeValorations++;
                                              }
                                          }


                                          note.objectId = parseNote.id;
                                          note.coordinateLatitude = parseNote.get("Position").latitude;
                                          note.coordinateLongitude = parseNote.get("Position").longitude;
                                          note.content = parseNote.get("Text");
                                          note.textLocation = parseNote.get("LocationText");
                                          note.authorId = noteAuthor.id;
                                          note.authorName = noteAuthor.get("username");
                                          note.authorImage = noteAuthor.get("image").url();
                                          note.UpdatedAt = parseNote.updatedAt;
                                          note.CreatedAt = parseNote.createdAt;
                                          note.viewed = true;

                                          note.likesCount = positiveValorations;
                                          note.hatesCount = negativeValorations;
                                          notesArray.push(note);
                                          if(notesArray.length >= results.length)
                                          {
                                              response.success(notesArray);
                                          }
                                      },
                                      error: function() {
                                        response.error("error extracting likes");
                                      }
                                  });
                          }
                      });

                      }
                    });


                }
            },
            error: function() {
              response.error("error extracting notes");
            }
        });

    }
    else
    {
        response.error("no user");
    }

});

Parse.Cloud.afterSave("Note", function(request) {
  Parse.Cloud.useMasterKey();
  if(!request.object.existed())
  {
    var user = request.user;
    var userCurrentPoints = user.get("points");
    user.set("points",userCurrentPoints - 5);
    user.save();
  }
});

Parse.Cloud.afterSave(Parse.User, function(request) {
  Parse.Cloud.useMasterKey();
  if(!request.object.existed())
  {
    var user = request.object;
    var userCurrentPoints = user.get("points");
    user.set("points",2500);
    user.save();
  }
});

var Image = require("parse-image");

Parse.Cloud.beforeSave("_User", function(request, response) {
  var user = request.object;
  if (!user.get("image")) {
    response.success();
    return;
  }

  if (!user.dirty("image")) {
    // The profile photo isn't being modified.
    response.success();
    return;
  }

  Parse.Cloud.httpRequest({
    url: user.get("image").url()

  }).then(function(response) {
    var image = new Image();
    return image.setData(response.buffer);

  }).then(function(image) {
    // Crop the image to the smaller of width or height.
    var size = Math.min(image.width(), image.height());
    return image.crop({
      left: (image.width() - size) / 2,
      top: (image.height() - size) / 2,
      width: size,
      height: size
    });

  }).then(function(image) {
    // Resize the image to 64x64.
    return image.scale({
      width: 392,
      height: 392
    });

  }).then(function(image) {
    // Make sure it's a JPEG to save disk space and bandwidth.
    return image.setFormat("JPEG");

  }).then(function(image) {
    // Get the image data in a Buffer.
    return image.data();

  }).then(function(buffer) {
    // Save the image into a new file.
    var base64 = buffer.toString("base64");
    var cropped = new Parse.File("profile.jpg", { base64: base64 });
    return cropped.save();

  }).then(function(cropped) {
    // Attach the image file to the original object.
    user.set("image", cropped);

  }).then(function(result) {
    response.success();
  }, function(error) {
    response.error(error);
  });
});

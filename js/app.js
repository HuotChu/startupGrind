/**
 * Created by Scott on 4/9/2015.
 */
define(['./temple', './request', './notify'], function(temple, request, notify) {
        // namespace the application object & designate a node to build the UI in
    var app = {
            "currentUser": 4,
            "data": {}
        },
        attachNode = document.querySelector(".temple");

    NodeList.prototype.forEach = Array.prototype.forEach;

    app.start = function() {
        notify.subscribe('discussions', {
            "callBack": this.showDiscussion,
            "context": this
        });

        notify.subscribe('showTopics', {
            "callBack": this.showTopics,
            "context": this
        });

        notify.publish('showTopics');

        notify.subscribe('editComment', {
            "callBack": this.editComment,
            "context": {}
        });

        notify.subscribe('deleteComment', {
            "callBack": this.deleteComment,
            "context": {}
        });
    };

    app.showTopics = function() {
        request('templates/topic.html').then(function(XHR) {
                // this response is the html template for topics (templates/topic.html)
            return XHR.response;
        })  // chained 'then' passes the html template in
            .then(function(html) {
                // inner request gets the data to merge
                request('json/topics.json').then(
                    function(xhr) {
                        var response = xhr.response,
                            obj = JSON.parse(response),
                            topics = obj['topics'] || [],
                            count = topics.length,
                            frag = document.createDocumentFragment(),
                            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            i = 0,
                            dataMap = {},
                            topicName,
                            topic,
                            template,
                            linkId,
                            date,
                            day,
                            month,
                            year;

                        // cache request
                        app.data = obj;
                        // ensure empty DOM
                        attachNode.innerHTML = '';

                        for (i; i < count; ++i) {
                            topic = topics[i];
                            date = new Date(topic['datetime']);
                            day = date.getDate();
                            month = date.getMonth();
                            year = date.getFullYear();
                            // map data to variables in html template
                            topicName = dataMap['topicName'] = topic['name'];
                            linkId = dataMap['linkId'] = topicName + i;
                            dataMap['title'] = topic['title'];
                            dataMap['introText'] = topic['discussion'];
                            dataMap['author'] = topic['author'];
                            dataMap['day'] = day;
                            dataMap['month'] = months[month];
                            dataMap['year'] = year;
                            // merge data with template
                            template = temple(html, dataMap, true);
                            // attach event handler(s)
                            template.querySelector('#' + linkId).addEventListener('click', notify.publisher);

                            frag.appendChild(template);
                        }

                        attachNode.appendChild(frag);
                    }
                );
            }
        );
    };

    app.showDiscussion = function(obj) {
        var topic = obj['topic'],
            promiseArray = [
                request('templates/discussion.html'),
                request('templates/post.html'),
                request('templates/comment.html'),
                request('json/' + topic + '.json')
            ];

        // ensure empty DOM
        attachNode.innerHTML = '';

        Promise.all(promiseArray).then(function (resultsArray) {
            var discussionPage = resultsArray[0].response,
                postTemplate = resultsArray[1].response,
                commentTemplate = resultsArray[2].response,
                obj = app.data = JSON.parse(resultsArray[3].response),
                discussion = obj['discussion'],
                posts = discussion['comments'],
                postCount = posts.length,
                postDOM = '',
                commentDOM = '',
                i = 0,
                j = 0,
                pageMap,
                postMap,
                commentMap,
                comments,
                comment,
                commentCount,
                post;

            for (i; i < postCount; ++i) {
                post = posts[i];
                comments = post['comments'];
                commentCount = comments.length;
                commentDOM = '';

                for (j = 0; j < commentCount; ++j) {
                    comment = comments[j];
                    if (comment['public'] && !comment['deleted']) {
                        commentMap = {
                            "comment": comment['comment'],
                            "author": comment['author'],
                            "buttons": comment['author_id'] === app.currentUser ? 'show' : 'hide',
                            "date": new Date(comment['datetime']).toLocaleDateString(),
                            "discussId": discussion['id'],
                            "postId": post['id'],
                            "commentId": comment['id']
                        };

                        commentDOM += temple(commentTemplate, commentMap);
                    }
                }
                // commentDOM now holds all comments
                postMap = {
                    "postText": post['comment'],
                    "author": post['author'],
                    "postDate": new Date(post['datetime']).toLocaleDateString(),
                    "comments": commentDOM,
                    "commentsClass": commentCount ? 'comments' : 'remove'
                };

                postDOM += temple(postTemplate, postMap);
            }
            // postDOM holds all the posts

            pageMap = {
                "title": discussion['title'],
                "author": discussion['author'],
                "date": new Date(discussion['datetime']).toLocaleDateString(),
                "discussion": discussion['discussion'],
                "posts": postDOM
            };

            attachNode.appendChild(temple(discussionPage, pageMap, true));

            attachNode.querySelector('#topicLink').addEventListener('click', function () {
                notify.publish('showTopics');
            });

            attachNode.querySelectorAll('.edit').forEach(function (el) {
                el.addEventListener('click', notify.publisher);
            });

            attachNode.querySelectorAll('.delete').forEach(function (el) {
                el.addEventListener('click', notify.publisher);
            });

        }).catch(function(err) {
            console.log('Something broke...', err);

            throw err;
        });
    };

    app.editComment = function(o) {
        var commentNode = document.getElementById('comment' + o.discussion + o.post + o.comment);

        commentNode.contentEditable = true;
        commentNode.focus();

        if (typeof commentNode.onblur !== "function") {
            commentNode.addEventListener('blur', function() {
                this.contentEditable = false;
                /*
                TODO: This is where I would update the JSON and send it back to the server...
                      app.data holds the current JSON to mangle as needed
                 */
            });
        }

    };

    app.deleteComment = function(o) {
        var commentNode = document.getElementById('commentAll' + o.discussion + o.post + o.comment);

        commentNode.className = 'remove';
        /*
         TODO: This is where I would update the JSON and send it back to the server...
               app.data holds the current JSON to mangle as needed
         */
    };

    return app;
});

  const request = require('request')

function myFetch() {
    const arr = [{"article": "a", "comments": 1}, {"article": "z", "comments": 4}, {"article": "a", "comments": 5}, {"article": "b", "comments": 5}]

    console.log(arr.sort((a,b) => {
         if (a.comments === b.comments) {
            return b.article - a.article;
         }
         return a.comments > b.comments ? 1 : -1;
    }).slice(0, 2))
  }


  function test(){
      const arr=[];
    const data = [
        {
          title: 'Show HN: This up votes itself',
          url: 'http://news.ycombinator.com/vote?for=3742902&dir=up&whence=%6e%65%77%65%73%74',
          author: 'olalonde',
          num_comments: 83,
          story_id: null,
          story_title: null,
          story_url: null,
          parent_id: null,
          created_at: 1332463239
        },
        {
          title: null,
          url: null,
          author: 'olalonde',
          num_comments: null,
          story_id: null,
          story_title: 'Guacamole – A clientless remote desktop gateway',
          story_url: 'https://guacamole.incubator.apache.org/',
          parent_id: 6547669,
          created_at: 1381763543
        }
      ];

      data
      .filter(a => a.title !== null || a.story_title !== null)
      .map(article => {
          console.log(article)
          arr.push({"name": article.title !== null ? article.title : article.story_title, "num_comments": article.num_comments === null? 0:article.num_comments});
  
      })
      .sort((a,b) => {
            if (a.num_comments === b.num_comments) {
            return b.name - a.name;
            }
            return a.num_comments > b.num_comments ? 1 : -1;
        })
        .map(x => x.name)
        .slice(0, 3)

  }

test();

//res.data
    //         .filter(a => !a.title && !a.story_title)
    //         .map(article => {
    //             arr.push(article.title ? article.title : article.story_title);
        
    // });
    
    // const sortedArray = arr.sort((a,b) => {
    //     if (a.comments === b.comments) {
    //     return b.article - a.article;
    //     }
    //     return a.comments > b.comments ? 1 : -1;
    // });
    
    // sortedArray.slice(0, limit);
var POST_ROOT = "post";


/**
 * 文章列表缓存。
 * 注意：从index.json得到的每个对象称为article。Post对象是它的扩展。
 */
var articleList = [];

// 数组遍历
Array.prototype.each = function(handle) {
    for (var i = 0; i < this.length; i++) {
        handle(this[i], i);
    }
}

// Post类
function Post(name) {
    this.name = name;
    this.url = Post.getUrl(name);
    this.index = Post.getIndex(name);
    var article = articleList[this.index];
    this.title = post.title;
    this.tags = post.tags;
    this.date = post.date;
}

// 获取Post
Post.prototype.get = function(callback) {
    var box = $('<div class="post-content" />');
    $.get(this.url, function(content) {
        // 解析Markdown为HTML
        var html = new Showdown.converter().makeHtml(content); 
        
        // 为高亮添加语言类型
        html = html.replace(/<p>@(\w+)#?(\w*)<\/p>[\n|\s|\t]*<pre><code>/g, 
            '<pre><code class="$1" id="$2">')
        
        // 载入容器
        box.html(html);
        
        // 高亮
        hljs.highlightBlock(box[0]);
        
        // 回调
        callback(box);
    });
}

// 据名称，获取post的URL
Post.getUrl = function(name) {
    return POST_ROOT + '/' + name + '.md';
}

// 根据名称，获取post对象在列表中的索引
Post.getIndex = function(name) {
    var index = -1;
    article.each(function(article, i) {
        if (article.name == name) index = i;
    });

    return index;
}

// Post的分页器
function PostPaginator(post) {
    this.post = post;
}

PostPaginator.prototype.get = function() {
    var box = $('<div class="post-paging" />');
    var prevWrapper = $('<span class="post-prev"><a /></span>');
    var nextWrapper = $('<span class="post-next"><a /></span>');
    
    var n = this.post.index;

    if (n > 0) {
        var prev = articleList[n-1];
        $('a' prevWrapper).attr('href', '#!' + prev.name).attr('title', prev.title)
    }
    else {
        $('a' prevWrapper).addClass('disable-link');
    }
    
    if (n < postList.length - 1) {
        var next = articleList[n+1];
        $('a' nextWrapper).attr('href', '#!' + next.name).attr('title', next.title)
    }
    else {
        $('a' nextWrapper).addClass('disable-link');
    }
    
    box.append(prevWrapper).append(nextWrapper);
    return box;
};

// Post的标签
function Tags(tagNames) {
    this.tagNames = tagNames;
}

Tags.prototype.get = function() {
    var box = $('<span class="post-tags" />');
    this.tagNames.each(function(tagName) {
        box.append($('<a />').attr('href', '#@' + tagName));
    });
    return box;
}

// Post列表
function PostLines(articleList) {
    this.articleList = articleList;
}

PostLines.prototype.get = function() {
    var box = $('<div class="post-lines" />');
    
    this.articleList.each(function(article, i) {
        var postE = $('<li class="post-li" />');
        
        var titleE = $('<a class="post-title" />').text(article.title);
        titleE.attr('title', article.title);
        titleE.attr('href', '#!' + article.name);
        
        var dateE = $('<span class="post-date" />').text(article.date);
        
        var tagsE = new Tags(article.tags).get();
        
        postE.append(titleE).append(dateE).append(tagsE);
        box.append(postE);
    });
    
    return box;
}

// 获取文章列表
function loadAritcleList(callback) {
    if (null == articleList || articleList.length == 0) {
        $.get(POST_ROOT + '/index.json', function(articleList) { 
            if(callback)callback(articleList);
        });
    }
    else {
        if(callback)callback(articleList);
    }
}

// 本地存储的存和取
function local() {
    if (localStorage) {
        switch (arguments.length) {
            case 1: return localStorage[arguments[0]]; 
                    break;
            case 2: localStorage[arguments[0]] = arguments[1];
        }
    }
    else {
        return undefined;
    }
}

function initBgColor() {
    if (local('bg-color') == undefined) {
        local('bg-color', DEFAULT_BG_COLOR);
        $('html').css('background-color', DEFAULT_BG_COLOR);
    }
    else 
        $('html').css('background-color', local('bg-color'));
}

$(function(){
    // 初始化页面背景
    initBgColor();
    
    // hash change event
    $(window).hashchange(function(){
        loadPostList(function() {
            handleHashChange(location.hash);
            
            // 重载comment
            //loadWidget($('#comment'), COMMENT_WIDGET);    
        });
    });
    
    $(window).hashchange();
    
    // load widget
    loadAllWidget();
});

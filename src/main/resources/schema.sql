CREATE TABLE IF NOT EXISTS API_GROUP
(
    API_GROUP_ID   INTEGER auto_increment primary key,
    API_GROUP_NAME CHARACTER VARYING(255) not null,
    API_BASE_URL   CHARACTER VARYING(64)
);


CREATE TABLE IF NOT EXISTS api_config
(
    API_CONFIG_ID    CHARACTER VARYING(64)   not null primary key,
    API_GROUP_ID     CHARACTER VARYING(64)   not null,
    API_CONFIG_NAME  CHARACTER VARYING(255)  not null,
    API_URL          CHARACTER VARYING(1024) not null,
    COMMENT          CHARACTER VARYING(1024),
    RESPONSE         CHARACTER LARGE OBJECT,
    REQUEST          CHARACTER LARGE OBJECT,
    CREATE_TIME      DATE                  default LOCALTIMESTAMP,
    UPDATE_TIME      DATE                  default LOCALTIMESTAMP,
    API_METHOD       CHARACTER VARYING(32) default 'GET',
    CONTENT_TYPE     CHARACTER VARYING     default 'application/json',
    STATUS_CODE      INTEGER               default 200,
    DELAY            INTEGER               default 0,
    ENABLED          BOOLEAN               default true,
    REQUEST_MATCH    CHARACTER LARGE OBJECT,
    HEADER_MATCH     CHARACTER LARGE OBJECT,
    RESPONSE_HEADERS CHARACTER LARGE OBJECT,
    is_template      tinyint               default 0 comment '0: 不启动模版 1: 启动模版消息',
    constraint API_CONFIG_UK unique (API_METHOD, API_URL, API_GROUP_ID)
);

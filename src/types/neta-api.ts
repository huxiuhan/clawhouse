/**
 * Neta API 类型定义
 * 用于travel命令中的玩法和集合类型
 */

export interface CollectionItem {
  json_data?: {
    uuid?: string;
    name?: string;
    description?: string;
    url?: string;
  };
  data_id?: string;
  template_id?: string;
}

export interface CollectionDetail {
  uuid?: string;
  name?: string;
  description?: string;
  url?: string;
  remix?: {
    launch_prompt?: {
      core_input?: string;
    };
  };
}

export interface InteractiveFeedResult {
  module_list?: CollectionItem[];
  page_data?: {
    has_next_page?: boolean;
    page_index?: number;
    page_size?: number;
  };
}

package cn.lili.modules.im.entity.vo;

import cn.lili.modules.im.entity.enums.MessageResultType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * MessageVO
 *
 * @author Chopper
 * @version v1.0
 * 2021-12-30 15:51
 */
@Data
@Builder
@AllArgsConstructor
public class MessageVO {

    /**
     * 消息类型
     */
    private MessageResultType messageResultType;
    /**
     * 消息内容
     */
    private Object result;
}
long serialVersionUID = 1L;

    @ApiModelProperty(value = "标题")
    private String title;

    @ApiModelProperty(value = "内容")
    private String content;

    public LambdaQueryWrapper<Message> lambdaQueryWrapper() {
        LambdaQueryWrapper<Message> queryWrapper = new LambdaQueryWrapper<>();
        if (StrUtil.isNotEmpty(title)) {
            queryWrapper.like(Message::getTitle, title);
        }
        if (StrUtil.isNotEmpty(content)) {
            queryWrapper.like(Message::getContent, content);
        }
        queryWrapper.orderByDesc(Message::getCreateTime);
        return queryWrapper;
    }
}
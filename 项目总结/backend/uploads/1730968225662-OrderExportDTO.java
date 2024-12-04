package cn.lili.modules.order.order.entity.dto;

import cn.lili.common.enums.ClientTypeEnum;
import cn.lili.modules.order.order.entity.enums.OrderItemAfterSaleStatusEnum;
import cn.lili.modules.order.order.entity.enums.OrderStatusEnum;
import cn.lili.modules.order.order.entity.enums.OrderTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * 订单导出DTO
 * @author Bulbasaur
 * @since 2021/6/3 6:36 下午
 *
 */
@Data
public class OrderExportDTO {

    @ApiModelProperty(value = "主订单编号")
    private String orderSn;
    @ApiModelProperty(value = "子订单编号")
    private String orderItemSn;
    @ApiModelProperty(value = "选购商品")
    private String goodsName;
    @ApiModelProperty(value = "商品数量")
    private Integer num;
    @ApiModelProperty(value = "商品ID")
    private String goodsId;
    @ApiModelProperty(value = "商品单价")
    private Double unitPrice;
    @ApiModelProperty(value = "订单应付金额")
    private Double flowPrice;
    @ApiModelProperty(value = "价格内容")
    private String priceDetail;
    @ApiModelProperty(value = "支付方式")
    private String paymentMethod;
    @ApiModelProperty(value = "收件人")
    private String consigneeName;
    @ApiModelProperty(value = "收件人手机")
    private String consigneeMobile;
    @ApiModelProperty(value = "收件人地址")
    private String consigneeAddressPath;
    @ApiModelProperty(value = "详细地址")
    private String consigneeDetail;
    @ApiModelProperty(value = "买家留言")
    private String remark;
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @ApiModelProperty(value = "订单提交时间")
    private Date createTime;
    @ApiModelProperty(value = "支付完成时间")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date paymentTime;
    /**
     * @see ClientTypeEnum
     */
    @ApiModelProperty(value = "来源")
    private String clientType;
    /**
     * @see OrderStatusEnum
     */
    @ApiModelProperty(value = "订单状态")
    private String orderStatus;
    /**
     * @see OrderTypeEnum
     */
    @ApiModelProperty(value = "订单类型")
    private String orderType;
    /**
     * @see OrderItemAfterSaleStatusEnum
     */
    @ApiModelProperty(value = "售后状态")
    private String afterSaleStatus;
    @ApiModelProperty(value = "取消原因")
    private String cancelReason;
    @ApiModelProperty(value = "发货时间")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date logisticsTime;
    @ApiModelProperty(value = "完成时间")
    @JsonFormat(timezone = "GMT+8", pattern = "yyyy-MM-dd HH:mm:ss")
    private Date completeTime;
    @ApiModelProperty(value = "店铺")
    private String storeName;
}
